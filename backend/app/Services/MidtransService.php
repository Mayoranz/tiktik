<?php

namespace App\Services;

use App\Models\Transaction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MidtransService
{
    /**
     * Generate Midtrans Snap Token for a given Transaction.
     */
    public static function createSnapToken(Transaction $transaction): array
    {
        $serverKey = config('midtrans.server_key');
        $snapUrl = config('midtrans.snap_url');

        $orderId = 'TIKTIK-TRX-' . $transaction->id . '-' . time();

        $transaction->load(['user', 'event', 'items.ticketType']);

        $itemDetails = [];
        foreach ($transaction->items as $item) {
            $itemDetails[] = [
                'id' => 'TT-' . $item->ticket_type_id,
                'price' => (int) $item->price,
                'quantity' => (int) $item->quantity,
                'name' => mb_substr($item->ticketType->name ?? 'Tiket Event', 0, 50),
            ];
        }

        $params = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) $transaction->total_amount,
            ],
            'customer_details' => [
                'first_name' => $transaction->user->username ?? 'Buyer',
                'email' => $transaction->user->email ?? 'buyer@tiktik.com',
                'phone' => $transaction->user->phone ?? '081200000000',
            ],
            'item_details' => $itemDetails,
        ];

        try {
            $response = Http::withBasicAuth($serverKey, '')
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->post($snapUrl, $params);

            if ($response->successful()) {
                $data = $response->json();
                
                $transaction->update([
                    'midtrans_order_id' => $orderId,
                    'snap_token' => $data['token'] ?? null,
                    'snap_url' => $data['redirect_url'] ?? null,
                ]);

                return [
                    'token' => $data['token'] ?? null,
                    'redirect_url' => $data['redirect_url'] ?? null,
                    'order_id' => $orderId,
                ];
            } else {
                Log::error('Midtrans Snap Error: ' . $response->body());
                throw new \Exception('Gagal menghubungi Midtrans Gateway: ' . $response->status());
            }
        } catch (\Exception $e) {
            Log::error('Midtrans Exception: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Check and update payment status directly from Midtrans API.
     */
    public static function checkAndUpdateStatus(Transaction $transaction): array
    {
        if (!$transaction->midtrans_order_id) {
            return [
                'updated' => false,
                'status' => $transaction->status,
                'message' => 'Order ID Midtrans belum dibuat.',
            ];
        }

        $serverKey = config('midtrans.server_key');
        $apiUrl = config('midtrans.api_url');
        $statusUrl = $apiUrl . '/' . $transaction->midtrans_order_id . '/status';

        try {
            $response = Http::withBasicAuth($serverKey, '')
                ->withHeaders(['Accept' => 'application/json'])
                ->get($statusUrl);

            Log::info("Midtrans Status Check [Order: {$transaction->midtrans_order_id}] Code: " . $response->status() . " Body: " . $response->body());

            if ($response->successful()) {
                $data = $response->json();
                $trxStatus = $data['transaction_status'] ?? null;
                $fraudStatus = $data['fraud_status'] ?? null;
                $paymentType = $data['payment_type'] ?? null;

                if ($trxStatus === 'settlement' || ($trxStatus === 'capture' && ($fraudStatus === 'accept' || !$fraudStatus))) {
                    \App\Http\Controllers\MidtransWebhookController::approveTransaction($transaction, $paymentType);
                    $transaction->refresh();
                    return [
                        'updated' => true,
                        'status' => 'approved',
                        'midtrans_status' => $trxStatus,
                        'message' => 'Pembayaran berhasil dikonfirmasi!',
                    ];
                } else if (in_array($trxStatus, ['deny', 'expire', 'cancel'])) {
                    \App\Http\Controllers\MidtransWebhookController::rejectTransaction($transaction, $paymentType, $trxStatus ?? 'failed');
                    $transaction->refresh();
                    return [
                        'updated' => true,
                        'status' => 'rejected',
                        'midtrans_status' => $trxStatus,
                        'message' => 'Pembayaran dibatalkan atau expired.',
                    ];
                } else {
                    return [
                        'updated' => false,
                        'status' => $transaction->status,
                        'midtrans_status' => $trxStatus ?? 'pending',
                        'message' => 'Status di Midtrans: ' . ($trxStatus ?? 'Pending'),
                    ];
                }
            }
        } catch (\Exception $e) {
            Log::warning("Midtrans Status Check failed for transaction #{$transaction->id}: " . $e->getMessage());
        }

        return [
            'updated' => false,
            'status' => $transaction->status,
            'message' => 'Gagal mengecek status ke Midtrans.',
        ];
    }
}
