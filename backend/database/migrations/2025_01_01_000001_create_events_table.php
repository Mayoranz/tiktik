<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('operator_id')->constrained('users')->cascadeOnDelete();
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->string('location_name', 150)->nullable();
            $table->text('google_maps_url')->nullable();
            $table->dateTime('event_date');
            $table->dateTime('ticket_sales_start');
            $table->enum('status', ['draft', 'published', 'live', 'finished', 'cancelled'])->default('draft');
            $table->boolean('is_exclusive')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
