<?php

namespace App\Http\Controllers\Buyer;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $transactions = $request->user()->transactions()
            ->with(['event:id,title,event_date', 'items.ticketType:id,name,price'])
            ->latest()
            ->paginate(10);

        return response()->json($transactions);
    }

    public function show(Request $request, $id)
    {
        $transaction = Transaction::where('user_id', $request->user()->id)
            ->with(['event.banners', 'event.paymentMethods', 'items.ticketType', 'tickets.seat'])
            ->findOrFail($id);

        // Auto sync status with Midtrans API if pending
        if ($transaction->status === 'pending' && $transaction->midtrans_order_id) {
            \App\Services\MidtransService::checkAndUpdateStatus($transaction);
            $transaction->refresh();
            $transaction->load(['tickets.seat', 'tickets.ticketType']);
        }

        // Check if expired
        if ($transaction->isExpired()) {
            $transaction->update(['status' => 'expired']);
            // Release locked seats
            foreach ($transaction->tickets as $ticket) {
                if ($ticket->seat) {
                    $ticket->seat->update(['status' => 'available', 'locked_until' => null]);
                }
            }
        }

        return response()->json(['data' => $transaction]);
    }

    public function uploadProof(Request $request, $id)
    {
        $request->validate([
            'payment_proof' => 'required|image|mimes:jpg,jpeg,png|max:5120',
        ]);

        $transaction = Transaction::where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->findOrFail($id);

        if ($transaction->isExpired()) {
            return response()->json(['message' => 'Transaksi telah expired.'], 422);
        }

        $path = $request->file('payment_proof')->store('payment-proofs', 'public');

        $transaction->update(['payment_proof' => $path]);

        return response()->json([
            'message' => 'Bukti pembayaran berhasil diupload. Menunggu verifikasi operator.',
            'payment_proof' => $path,
        ]);
    }

    public function syncMidtrans(Request $request, $id)
    {
        $transaction = Transaction::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $result = \App\Services\MidtransService::checkAndUpdateStatus($transaction);

        $transaction->refresh();
        $transaction->load(['event.banners', 'items.ticketType', 'tickets.seat']);

        return response()->json([
            'message' => $result['message'],
            'result' => $result,
            'data' => $transaction,
        ]);
    }
}
