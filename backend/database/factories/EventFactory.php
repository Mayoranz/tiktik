<?php

namespace Database\Factories;

use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'operator_id' => 2, // Assuming operator ID 2 exists (MegaEntertainment)
            'category_id' => $this->faker->numberBetween(1, 8),
            'title' => rtrim($this->faker->sentence(3), '.') . ' ' . $this->faker->year(),
            'description' => $this->faker->paragraphs(3, true),
            'location_name' => $this->faker->city() . ' Convention Center',
            'google_maps_url' => 'https://maps.google.com/?q=' . urlencode($this->faker->city()),
            'event_date' => $this->faker->dateTimeBetween('+10 days', '+60 days'),
            'ticket_sales_start' => $this->faker->dateTimeBetween('-5 days', '+5 days'),
            'status' => 'published',
            'is_exclusive' => $this->faker->boolean(20),
            'is_featured' => false,
            'is_ticket_sales_paused' => false,
        ];
    }
}
