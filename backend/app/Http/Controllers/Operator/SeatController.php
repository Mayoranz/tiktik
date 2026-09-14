<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Models\Seat;
use App\Models\TicketType;
use Illuminate\Http\Request;

class SeatController extends Controller
{
    public function index(Request $request, $ticketTypeId)
    {
        $ticketType = TicketType::findOrFail($ticketTypeId);
        return response()->json(['data' => $ticketType->seats]);
    }

    public function store(Request $request, $ticketTypeId)
    {
        $ticketType = TicketType::findOrFail($ticketTypeId);

        $validated = $request->validate([
            'seat_number' => 'required|string|max:20',
        ]);

        $seat = $ticketType->seats()->create($validated);

        return response()->json(['message' => 'Kursi berhasil ditambahkan.', 'data' => $seat], 201);
    }

    public function bulkStore(Request $request, $ticketTypeId)
    {
        $ticketType = TicketType::findOrFail($ticketTypeId);

        $validated = $request->validate([
            'prefix' => 'required|string|max:5',
            'start' => 'required|integer|min:1',
            'end' => 'required|integer|gte:start',
        ]);

        $seats = [];
        for ($i = $validated['start']; $i <= $validated['end']; $i++) {
            $seats[] = $ticketType->seats()->create([
                'seat_number' => $validated['prefix'] . $i,
            ]);
        }

        return response()->json([
            'message' => count($seats) . ' kursi berhasil ditambahkan.',
            'data' => $seats,
        ], 201);
    }

    public function destroy($id)
    {
        Seat::findOrFail($id)->delete();
        return response()->json(['message' => 'Kursi berhasil dihapus.']);
    }
}
