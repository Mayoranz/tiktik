<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\Event;
use Illuminate\Http\Request;

class ScannerController extends Controller
{
    public function scan(Request $request)
    {
        $request->validate([
            'qr_code_token' => 'required|string',
        ]);

        $ticket = Ticket::where('qr_code_token', $request->qr_code_token)
            ->with(['ticketType', 'seat', 'transaction.event', 'transaction.user:id,username'])
            ->first();

        if (!$ticket) {
            return response()->json([
                'valid' => false,
                'message' => 'QR Code tidak valid.',
            ], 404);
        }

        // Verify operator owns this event
        $event = $ticket->transaction->event;
        if ($event->operator_id !== $request->user()->id) {
            return response()->json([
                'valid' => false,
                'message' => 'Anda tidak memiliki akses ke event ini.',
            ], 403);
        }

        if ($ticket->is_scanned) {
            return response()->json([
                'valid' => false,
                'message' => 'Tiket sudah pernah di-scan pada ' . $ticket->scanned_at->format('d M Y H:i'),
                'ticket' => $ticket,
            ], 422);
        }

        $ticket->markAsScanned();

        return response()->json([
            'valid' => true,
            'message' => 'Check-in berhasil!',
            'ticket' => $ticket->fresh(['ticketType', 'seat', 'transaction.user:id,username']),
        ]);
    }
}
