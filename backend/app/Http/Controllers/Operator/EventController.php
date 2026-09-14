<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventBanner;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $events = Event::where('operator_id', $request->user()->id)
            ->with(['banners', 'ticketTypes'])
            ->withCount(['transactions'])
            ->latest()
            ->paginate(10);

        return response()->json($events);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'category_id' => 'required|exists:categories,id',
            'description' => 'nullable|string',
            'location_name' => 'nullable|string|max:150',
            'google_maps_url' => 'nullable|url',
            'event_date' => 'required|date|after:now',
            'ticket_sales_start' => 'required|date',
            'is_exclusive' => 'boolean',
        ]);

        $validated['operator_id'] = $request->user()->id;
        $validated['status'] = 'draft';

        $event = Event::create($validated);

        return response()->json([
            'message' => 'Event berhasil dibuat.',
            'data' => $event,
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $event = Event::where('operator_id', $request->user()->id)
            ->with(['banners', 'ticketTypes.seats', 'paymentMethods'])
            ->withCount(['transactions'])
            ->findOrFail($id);

        return response()->json(['data' => $event]);
    }

    public function update(Request $request, $id)
    {
        $event = Event::where('operator_id', $request->user()->id)->findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:150',
            'category_id' => 'sometimes|exists:categories,id',
            'description' => 'sometimes|nullable|string',
            'location_name' => 'sometimes|nullable|string|max:150',
            'google_maps_url' => 'sometimes|nullable|url',
            'event_date' => 'sometimes|date',
            'ticket_sales_start' => 'sometimes|date',
            'status' => 'sometimes|in:draft,published,live,finished,cancelled',
            'is_exclusive' => 'sometimes|boolean',
            'is_ticket_sales_paused' => 'sometimes|boolean',
        ]);

        $event->update($validated);

        return response()->json([
            'message' => 'Event berhasil diperbarui.',
            'data' => $event,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $event = Event::where('operator_id', $request->user()->id)->findOrFail($id);
        $event->delete();

        return response()->json(['message' => 'Event berhasil dihapus.']);
    }

    public function uploadBanner(Request $request, $eventId)
    {
        $event = Event::where('operator_id', $request->user()->id)->findOrFail($eventId);

        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,webp,gif|max:10240',
        ]);

        $file = $request->file('image');
        $dir  = storage_path("app/public/banners/{$event->id}");
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $filename = uniqid('banner_', true) . '.webp';
        $fullPath = $dir . '/' . $filename;

        // Try PHP GD conversion to WebP (quality 82)
        if (extension_loaded('gd') && function_exists('imagewebp')) {
            $mime   = $file->getMimeType();
            $source = match (true) {
                str_contains($mime, 'png')  => imagecreatefrompng($file->getRealPath()),
                str_contains($mime, 'gif')  => imagecreatefromgif($file->getRealPath()),
                str_contains($mime, 'webp') => imagecreatefromwebp($file->getRealPath()),
                default                     => imagecreatefromjpeg($file->getRealPath()),
            };
            if (str_contains($mime, 'png') || str_contains($mime, 'gif')) {
                imagepalettetotruecolor($source);
                imagealphablending($source, true);
                imagesavealpha($source, true);
            }
            imagewebp($source, $fullPath, 82);
            imagedestroy($source);
        } else {
            // GD not available — frontend already converted to WebP via Canvas
            $file->move($dir, $filename);
        }

        $relPath = "banners/{$event->id}/{$filename}";

        $banner = EventBanner::create([
            'event_id'   => $event->id,
            'image_url'  => '/storage/' . $relPath,
            'sort_order' => $event->banners()->count(),
        ]);

        return response()->json([
            'message' => 'Banner berhasil diupload (WebP).',
            'data'    => $banner,
        ], 201);
    }

    public function deleteBanner(Request $request, $eventId, $bannerId)
    {
        $event  = Event::where('operator_id', $request->user()->id)->findOrFail($eventId);
        $banner = EventBanner::where('event_id', $event->id)->findOrFail($bannerId);

        // Remove physical file
        $relativePath = ltrim(str_replace('/storage/', '', $banner->image_url), '/');
        $fullPath = storage_path('app/public/' . $relativePath);
        if (file_exists($fullPath)) {
            @unlink($fullPath);
        }

        $banner->delete();

        return response()->json(['message' => 'Banner berhasil dihapus.']);
    }
}
