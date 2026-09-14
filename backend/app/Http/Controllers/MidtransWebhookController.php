<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Ticket;
use App\Models\Seat;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MidtransWebhookController extends Controller
{
    /**
     * Handle incoming payment status notification webhook from Midtrans.
     */
    public function handleNotification(Request $request)
    {
        $orderId = $request->input('order_id');
        $statusCode = $request->input('status_code');
        $grossAmount = $request->input('gross_amount');
        $serverKey = config('midtrans.server_key');
        $inputSignature = $request->input('signature_key');

        // 🔒 SECURITY STEP 1: Verify SHA-512 Signature Key to prevent spoofing/hacking
        $computedSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);

        if (!$inputSignature || !hash_equals($computedSignature, $inputSignature)) {
            Log::warning("SECURITY ALERT: Invalid Midtrans signature attempt for order_id: {$orderId}");
            return response()->json([
                'message' => 'Invalid signature key. Access denied.',
            ], 403);
        }

        // Find transaction
        $transaction = Transaction::where('midtrans_order_id', $orderId)->first();

        if (!$transaction) {
            // Fallback: extract ID from TIKTIK-TRX-{id}-{time}
            if (preg_match('/TIKTIK-TRX-(\d+)-/', $orderId, $matches)) {
                $transaction = Transaction::find($matches[1]);
            }
        }

        if (!$transaction) {
            Log::error("Midtrans Webhook: Transaction not found for order_id {$orderId}");
            return response()->json(['message' => 'Transaction not found.'], 404);
        }

        $transactionStatus = $request->input('transaction_status');
        $type = $request->input('payment_type');
        $fraudStatus = $request->input('fraud_status');

        Log::info("Midtrans Notification received: Order {$orderId}, Status {$transactionStatus}, Type {$type}");

        // Handle payment states
        if ($transactionStatus == 'capture') {
            if ($fraudStatus == 'challenge') {
                // Fraud challenge
                $transaction->update(['status' => 'pending', 'payment_type' => $type]);
            } else if ($fraudStatus == 'accept') {
                $this->approveTransaction($transaction, $type);
            }
        } else if ($transactionStatus == 'settlement') {
            $this->approveTransaction($transaction, $type);
        } else if ($transactionStatus == 'pending') {
            $transaction->update(['payment_type' => $type]);
        } else if (in_array($transactionStatus, ['deny', 'expire', 'cancel'])) {
            $this->rejectTransaction($transaction, $type, $transactionStatus);
        }

        return response()->json(['message' => 'Notification processed successfully.']);
    }

    /**
     * Approve transaction and auto-generate QR tickets.
     */
    public static function approveTransaction(Transaction $transaction, ?string $paymentType = null)
    {
        // 🔒 IDEMPOTENCY: Ensure transaction is pending before processing to prevent duplicate tickets
        if ($transaction->status !== 'pending') {
            return;
        }

        DB::transaction(function () use ($transaction, $paymentType) {
            $transaction->update([
                'status' => 'approved',
                'payment_type' => $paymentType ?? $transaction->payment_type,
            ]);

            $transaction->load(['items.ticketType']);

            // Generate tickets & update seat status
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

            ActivityLog::log(
                'midtrans.payment_success',
                "Pembayaran Midtrans berhasil untuk transaksi #{$transaction->id}",
                $transaction->user_id
            );
        });
    }

    /**
     * Reject transaction and release locked seats.
     */
    public static function rejectTransaction(Transaction $transaction, ?string $paymentType = null, string $reason = '')
    {
        if ($transaction->status !== 'pending') {
            return;
        }

        DB::transaction(function () use ($transaction, $paymentType, $reason) {
            $transaction->update([
                'status' => 'rejected',
                'payment_type' => $paymentType ?? $transaction->payment_type,
            ]);

            $transaction->load(['items.ticketType']);

            // Release locked seats
            foreach ($transaction->items as $item) {
                if ($item->ticketType && $item->ticketType->is_numbered_seating) {
                    Seat::where('ticket_type_id', $item->ticket_type_id)
                        ->where('status', 'locked')
                        ->update(['status' => 'available', 'locked_until' => null]);
                }
            }

            ActivityLog::log(
                'midtrans.payment_failed',
                "Pembayaran Midtrans ({$reason}) gagal untuk transaksi #{$transaction->id}",
                $transaction->user_id
            );
        });
    }
}
