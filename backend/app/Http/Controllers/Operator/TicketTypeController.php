<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\TicketType;
use Illuminate\Http\Request;

class TicketTypeController extends Controller
{
    public function index(Request $request, $eventId)
    {
        $event = Event::where('operator_id', $request->user()->id)->findOrFail($eventId);
        return response()->json(['data' => $event->ticketTypes()->with('seats')->get()]);
    }

    public function store(Request $request, $eventId)
    {
        $event = Event::where('operator_id', $request->user()->id)->findOrFail($eventId);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'quota' => 'required|integer|min:1',
            'is_numbered_seating' => 'boolean',
        ]);

        $ticketType = $event->ticketTypes()->create($validated);

        return response()->json(['message' => 'Kategori tiket berhasil dibuat.', 'data' => $ticketType], 201);
    }

    public function show($id)
    {
        $ticketType = TicketType::with('seats')->findOrFail($id);
        return response()->json(['data' => $ticketType]);
    }

    public function update(Request $request, $id)
    {
        $ticketType = TicketType::findOrFail($id);
        Event::where('operator_id', $request->user()->id)->findOrFail($ticketType->event_id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'price' => 'sometimes|numeric|min:0',
            'quota' => 'sometimes|integer|min:1',
            'is_numbered_seating' => 'boolean',
        ]);

        $ticketType->update($validated);

        return response()->json(['message' => 'Kategori tiket berhasil diperbarui.', 'data' => $ticketType]);
    }

    public function destroy(Request $request, $id)
    {
        $ticketType = TicketType::findOrFail($id);
        Event::where('operator_id', $request->user()->id)->findOrFail($ticketType->event_id);
        $ticketType->delete();

        return response()->json(['message' => 'Kategori tiket berhasil dihapus.']);
    }
}
