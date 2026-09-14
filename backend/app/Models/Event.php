<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'operator_id',
        'title',
        'description',
        'location_name',
        'google_maps_url',
        'event_date',
        'ticket_sales_start',
        'status',
        'is_exclusive',
        'is_featured',
        'is_ticket_sales_paused',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'datetime',
            'ticket_sales_start' => 'datetime',
            'is_exclusive' => 'boolean',
            'is_featured' => 'boolean',
            'is_ticket_sales_paused' => 'boolean',
        ];
    }

    // ── Relationships ──

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function operator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    public function banners(): HasMany
    {
        return $this->hasMany(EventBanner::class)->orderBy('sort_order');
    }

    public function ticketTypes(): HasMany
    {
        return $this->hasMany(TicketType::class);
    }

    public function paymentMethods(): HasMany
    {
        return $this->hasMany(PaymentMethod::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    // ── Scopes ──

    public function scopePublished($query)
    {
        return $query->whereIn('status', ['published', 'live']);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }
}
