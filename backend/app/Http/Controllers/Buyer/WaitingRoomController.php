<?php

namespace App\Http\Controllers\Buyer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class WaitingRoomController extends Controller
{
    public function join(Request $request, $eventId)
    {
        $userId = $request->user()->id;
        $key = "waiting_room:{$eventId}";

        // Add user to queue with timestamp as score
        $position = Cache::get($key, []);
        if (!in_array($userId, $position)) {
            $position[] = $userId;
            Cache::put($key, $position, now()->addHours(2));
        }

        $pos = array_search($userId, $position);

        return response()->json([
            'message' => 'Anda masuk antrean.',
            'position' => $pos + 1,
            'total_in_queue' => count($position),
        ]);
    }

    public function status(Request $request, $eventId)
    {
        $userId = $request->user()->id;
        $key = "waiting_room:{$eventId}";

        $position = Cache::get($key, []);
        $pos = array_search($userId, $position);

        if ($pos === false) {
            return response()->json([
                'in_queue' => false,
                'can_proceed' => true,
            ]);
        }

        // Allow first 10 users to proceed
        $canProceed = $pos < 10;

        return response()->json([
            'in_queue' => true,
            'position' => $pos + 1,
            'total_in_queue' => count($position),
            'can_proceed' => $canProceed,
            'estimated_wait' => max(0, ($pos - 9)) * 30, // 30 seconds per batch
        ]);
    }

    public function leave(Request $request, $eventId)
    {
        $userId = $request->user()->id;
        $key = "waiting_room:{$eventId}";

        $position = Cache::get($key, []);
        $position = array_filter($position, fn($id) => $id !== $userId);
        Cache::put($key, array_values($position), now()->addHours(2));

        return response()->json(['message' => 'Anda keluar dari antrean.']);
    }
}
