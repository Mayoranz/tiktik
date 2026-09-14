<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;

class PaymentMethodController extends Controller
{
    public function index(Request $request, $eventId)
    {
        $event = Event::where('operator_id', $request->user()->id)->findOrFail($eventId);
        return response()->json(['data' => $event->paymentMethods]);
    }

    public function store(Request $request, $eventId)
    {
        $event = Event::where('operator_id', $request->user()->id)->findOrFail($eventId);

        $validated = $request->validate([
            'method' => 'required|in:bank_transfer,qris',
            'bank_name' => 'required_if:method,bank_transfer|nullable|string|max:100',
            'account_name' => 'required_if:method,bank_transfer|nullable|string|max:100',
            'account_number' => 'required_if:method,bank_transfer|nullable|string|max:100',
            'qris_image' => 'required_if:method,qris|nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('qris_image')) {
            $validated['qris_image'] = '/storage/' . $request->file('qris_image')->store("qris/{$event->id}", 'public');
        }

        $paymentMethod = $event->paymentMethods()->create($validated);

        return response()->json(['message' => 'Metode pembayaran berhasil ditambahkan.', 'data' => $paymentMethod], 201);
    }

    public function show($id)
    {
        return response()->json(['data' => PaymentMethod::findOrFail($id)]);
    }

    public function update(Request $request, $id)
    {
        $pm = PaymentMethod::findOrFail($id);

        $validated = $request->validate([
            'bank_name' => 'nullable|string|max:100',
            'account_name' => 'nullable|string|max:100',
            'account_number' => 'nullable|string|max:100',
        ]);

        $pm->update($validated);
        return response()->json(['message' => 'Metode pembayaran berhasil diperbarui.', 'data' => $pm]);
    }

    public function destroy($id)
    {
        PaymentMethod::findOrFail($id)->delete();
        return response()->json(['message' => 'Metode pembayaran berhasil dihapus.']);
    }
}
