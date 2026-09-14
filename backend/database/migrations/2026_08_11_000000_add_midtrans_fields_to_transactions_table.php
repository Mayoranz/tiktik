<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('midtrans_order_id')->nullable()->after('event_id');
            $table->string('snap_token')->nullable()->after('midtrans_order_id');
            $table->string('snap_url')->nullable()->after('snap_token');
            $table->string('payment_type')->nullable()->after('payment_proof');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn(['midtrans_order_id', 'snap_token', 'snap_url', 'payment_type']);
        });
    }
};
