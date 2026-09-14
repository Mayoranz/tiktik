<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Ticket;
use App\Models\Seat;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $eventIds = Event::where('operator_id', $request->user()->id)->pluck('id');

        $transactions = Transaction::whereIn('event_id', $eventIds)
            ->with(['user:id,username,email,phone', 'event:id,title', 'items.ticketType:id,name,price'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(15);

        return response()->json($transactions);
    }

    public function approve(Request $request, $id)
    {
        $eventIds = Event::where('operator_id', $request->user()->id)->pluck('id');
        $transaction = Transaction::whereIn('event_id', $eventIds)
            ->where('status', 'pending')
            ->findOrFail($id);

        return DB::transaction(function () use ($transaction) {
            $transaction->update(['status' => 'approved']);

            // Generate tickets
            foreach ($transaction->items as $item) {
                for ($i = 0; $i < $item->quantity; $i++) {
                    $seatId = null;

                    if ($item->ticketType->is_numbered_seating) {
                        $seat = Seat::where('ticket_type_id', $item->ticket_type_id)
                            ->where('status', 'locked')
                            ->first();

                        if ($seat) {
                            $seat->update(['status' => 'booked', 'locked_until' => null]);
                            $seatId = $seat->id;
                        }
                    }

                    Ticket::create([
                        'transaction_id' => $transaction->id,
                        'ticket_type_id' => $item->ticket_type_id,
                        'seat_id' => $seatId,
                    ]);
                }
            }

            $transaction->load(['tickets.seat', 'tickets.ticketType']);

            return response()->json([
                'message' => 'Pembayaran disetujui. QR Ticket diterbitkan.',
                'data' => $transaction,
            ]);
        });
    }

    public function reject(Request $request, $id)
    {
        $eventIds = Event::where('operator_id', $request->user()->id)->pluck('id');
        $transaction = Transaction::whereIn('event_id', $eventIds)
            ->where('status', 'pending')
            ->findOrFail($id);

        return DB::transaction(function () use ($transaction) {
            $transaction->update(['status' => 'rejected']);

            // Release locked seats
            foreach ($transaction->items as $item) {
                if ($item->ticketType->is_numbered_seating) {
                    Seat::where('ticket_type_id', $item->ticket_type_id)
                        ->where('status', 'locked')
                        ->update(['status' => 'available', 'locked_until' => null]);
                }
            }

            return response()->json(['message' => 'Pembayaran ditolak. Kursi dan kuota dikembalikan.']);
        });
    }
}
