<?php

namespace App\Http\Controllers\Buyer;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\Seat;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckoutController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'event_id' => 'required|exists:events,id',
            'items' => 'required|array|min:1',
            'items.*.ticket_type_id' => 'required|exists:ticket_types,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.seat_ids' => 'sometimes|array',
            'items.*.seat_ids.*' => 'exists:seats,id',
        ]);

        $user = $request->user();
        $event = Event::findOrFail($validated['event_id']);

        if (now()->greaterThan($event->event_date)) {
            return response()->json([
                'message' => 'Event telah selesai dilaksanakan.',
            ], 422);
        }

        if ($event->is_ticket_sales_paused) {
            return response()->json([
                'message' => 'Penjualan tiket sedang dihentikan sementara oleh operator.',
            ], 422);
        }

        // Check exclusive event limit (max 3 tickets per account)
        if ($event->is_exclusive) {
            $existingTickets = Transaction::where('user_id', $user->id)
                ->where('event_id', $event->id)
                ->whereIn('status', ['pending', 'approved'])
                ->withCount('tickets')
                ->get()
                ->sum('tickets_count');

            $newTicketCount = collect($validated['items'])->sum('quantity');

            if (($existingTickets + $newTicketCount) > 3) {
                return response()->json([
                    'message' => 'Event eksklusif: maksimal 3 tiket per akun.',
                ], 422);
            }
        }

        return DB::transaction(function () use ($validated, $user, $event) {
            $totalAmount = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $ticketType = \App\Models\TicketType::findOrFail($item['ticket_type_id']);

                // Check quota
                if ($ticketType->availableQuota < $item['quantity']) {
                    throw new \Exception("Kuota tiket {$ticketType->name} tidak mencukupi.");
                }

                $subtotal = $ticketType->price * $item['quantity'];
                $totalAmount += $subtotal;

                $itemsData[] = [
                    'ticket_type_id' => $ticketType->id,
                    'quantity' => $item['quantity'],
                    'price' => $ticketType->price,
                    'subtotal' => $subtotal,
                    'seat_ids' => $item['seat_ids'] ?? [],
                ];

                // Lock seats if numbered seating
                if ($ticketType->is_numbered_seating && !empty($item['seat_ids'])) {
                    $seats = Seat::whereIn('id', $item['seat_ids'])
                        ->where('status', 'available')
                        ->get();

                    if ($seats->count() !== count($item['seat_ids'])) {
                        throw new \Exception('Beberapa kursi sudah tidak tersedia.');
                    }

                    foreach ($seats as $seat) {
                        $seat->update([
                            'status' => 'locked',
                            'locked_until' => now()->addHour(),
                        ]);
                    }
                }
            }

            // Create transaction
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'event_id' => $event->id,
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'expires_at' => now()->addHour(),
            ]);

            // Create transaction items
            foreach ($itemsData as $itemData) {
                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'ticket_type_id' => $itemData['ticket_type_id'],
                    'quantity' => $itemData['quantity'],
                    'price' => $itemData['price'],
                    'subtotal' => $itemData['subtotal'],
                ]);
            }

            // Generate Midtrans Snap Token
            try {
                \App\Services\MidtransService::createSnapToken($transaction);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Midtrans Snap token generation error: ' . $e->getMessage());
            }

            $transaction->refresh();
            $transaction->load(['items.ticketType', 'event:id,title']);

            return response()->json([
                'message' => 'Checkout berhasil. Silakan lakukan pembayaran via Midtrans.',
                'transaction' => $transaction,
            ], 201);
        });
    }
}
