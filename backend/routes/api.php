<?php

use Illuminate\Support\Facades\Route;

// ══════════════════════════════════════════════════════════
//  TIKTIK API Routes
// ══════════════════════════════════════════════════════════

/*
|--------------------------------------------------------------------------
| Public Routes (No Auth)
|--------------------------------------------------------------------------
*/

// Auth
Route::post('/register', [\App\Http\Controllers\Auth\AuthController::class, 'register']);
Route::post('/login', [\App\Http\Controllers\Auth\AuthController::class, 'login']);

// OTP — Verifikasi Email & Lupa Password (public, tidak perlu login)
Route::post('/send-otp',      [\App\Http\Controllers\Auth\OtpController::class, 'sendOtp']);
Route::post('/verify-otp',    [\App\Http\Controllers\Auth\OtpController::class, 'verifyOtp']);
Route::post('/reset-password', [\App\Http\Controllers\Auth\OtpController::class, 'resetPassword']);


// Public Events & Categories
Route::get('/events', [\App\Http\Controllers\PublicController::class, 'events']);
Route::get('/events/featured', [\App\Http\Controllers\PublicController::class, 'featured']);
Route::get('/events/{id}', [\App\Http\Controllers\PublicController::class, 'show']);
Route::get('/categories', [\App\Http\Controllers\CategoryController::class, 'index']);
Route::get('/settings/public', [\App\Http\Controllers\PublicController::class, 'settings']);

// Midtrans Webhook Notification
Route::post('/midtrans/notification', [\App\Http\Controllers\MidtransWebhookController::class, 'handleNotification']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'maintenance'])->group(function () {

    // Auth
    Route::get('/user', [\App\Http\Controllers\Auth\AuthController::class, 'user']);
    Route::post('/logout', [\App\Http\Controllers\Auth\AuthController::class, 'logout']);
    Route::put('/profile', [\App\Http\Controllers\Auth\AuthController::class, 'updateProfile']);

    /*
    |----------------------------------------------------------------------
    | Buyer Routes
    |----------------------------------------------------------------------
    */
    Route::middleware('role:buyer')->prefix('buyer')->group(function () {
        // Dashboard
        Route::get('/dashboard', [\App\Http\Controllers\Buyer\DashboardController::class, 'index']);

        // Checkout
        Route::post('/checkout', [\App\Http\Controllers\Buyer\CheckoutController::class, 'store']);

        // Transactions
        Route::get('/transactions', [\App\Http\Controllers\Buyer\TransactionController::class, 'index']);
        Route::get('/transactions/{id}', [\App\Http\Controllers\Buyer\TransactionController::class, 'show']);
        Route::post('/transactions/{id}/sync-midtrans', [\App\Http\Controllers\Buyer\TransactionController::class, 'syncMidtrans']);
        Route::post('/transactions/{id}/upload-proof', [\App\Http\Controllers\Buyer\TransactionController::class, 'uploadProof']);

        // Tickets
        Route::get('/tickets', [\App\Http\Controllers\Buyer\TicketController::class, 'index']);
        Route::get('/tickets/{id}', [\App\Http\Controllers\Buyer\TicketController::class, 'show']);

        // Waiting Room
        Route::post('/waiting-room/join/{eventId}', [\App\Http\Controllers\Buyer\WaitingRoomController::class, 'join']);
        Route::get('/waiting-room/status/{eventId}', [\App\Http\Controllers\Buyer\WaitingRoomController::class, 'status']);
        Route::post('/waiting-room/leave/{eventId}', [\App\Http\Controllers\Buyer\WaitingRoomController::class, 'leave']);
    });

    /*
    |----------------------------------------------------------------------
    | Operator Routes
    |----------------------------------------------------------------------
    */
    Route::middleware('role:operator')->prefix('operator')->group(function () {
        // Dashboard
        Route::get('/stats', [\App\Http\Controllers\Operator\StatsController::class, 'index']);

        // Events CRUD
        Route::apiResource('events', \App\Http\Controllers\Operator\EventController::class);

        // Event Banners
        Route::post('/events/{eventId}/banners', [\App\Http\Controllers\Operator\EventController::class, 'uploadBanner']);
        Route::delete('/events/{eventId}/banners/{bannerId}', [\App\Http\Controllers\Operator\EventController::class, 'deleteBanner']);

        // Ticket Types
        Route::apiResource('events.ticket-types', \App\Http\Controllers\Operator\TicketTypeController::class)
            ->shallow();

        // Seats
        Route::get('/ticket-types/{ticketTypeId}/seats', [\App\Http\Controllers\Operator\SeatController::class, 'index']);
        Route::post('/ticket-types/{ticketTypeId}/seats', [\App\Http\Controllers\Operator\SeatController::class, 'store']);
        Route::post('/ticket-types/{ticketTypeId}/seats/bulk', [\App\Http\Controllers\Operator\SeatController::class, 'bulkStore']);
        Route::delete('/seats/{id}', [\App\Http\Controllers\Operator\SeatController::class, 'destroy']);

        // Payment Methods
        Route::apiResource('events.payment-methods', \App\Http\Controllers\Operator\PaymentMethodController::class)
            ->shallow();

        // Transaction Verification
        Route::get('/transactions', [\App\Http\Controllers\Operator\TransactionController::class, 'index']);
        Route::post('/transactions/{id}/approve', [\App\Http\Controllers\Operator\TransactionController::class, 'approve']);
        Route::post('/transactions/{id}/reject', [\App\Http\Controllers\Operator\TransactionController::class, 'reject']);

        // QR Scanner
        Route::post('/scan', [\App\Http\Controllers\Operator\ScannerController::class, 'scan']);

        // Reports
        Route::get('/events/{eventId}/report', [\App\Http\Controllers\Operator\StatsController::class, 'eventReport']);
    });

    /*
    |----------------------------------------------------------------------
    | Admin Routes
    |----------------------------------------------------------------------
    */
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        // Dashboard
        Route::get('/stats', [\App\Http\Controllers\Admin\DashboardController::class, 'index']);

        // Operators
        Route::get('/operators', [\App\Http\Controllers\Admin\OperatorController::class, 'index']);
        Route::post('/operators', [\App\Http\Controllers\Admin\OperatorController::class, 'store']);
        Route::put('/operators/{id}', [\App\Http\Controllers\Admin\OperatorController::class, 'update']);
        Route::post('/operators/{id}/approve', [\App\Http\Controllers\Admin\OperatorController::class, 'approve']);
        Route::post('/operators/{id}/suspend', [\App\Http\Controllers\Admin\OperatorController::class, 'suspend']);
        Route::post('/operators/{id}/block', [\App\Http\Controllers\Admin\OperatorController::class, 'block']);

        // Events
        Route::get('/events', [\App\Http\Controllers\Admin\EventController::class, 'index']);
        Route::post('/events/{id}/feature', [\App\Http\Controllers\Admin\EventController::class, 'toggleFeatured']);
        Route::post('/events/{id}/moderate', [\App\Http\Controllers\Admin\EventController::class, 'moderate']);

        // Users
        Route::get('/users', [\App\Http\Controllers\Admin\UserController::class, 'index']);
        Route::post('/users/{id}/ban', [\App\Http\Controllers\Admin\UserController::class, 'ban']);
        Route::post('/users/{id}/reset-password', [\App\Http\Controllers\Admin\UserController::class, 'resetPassword']);

        // Settings
        Route::get('/settings', [\App\Http\Controllers\Admin\SettingController::class, 'index']);
        Route::put('/settings', [\App\Http\Controllers\Admin\SettingController::class, 'update']);
        Route::post('/maintenance', [\App\Http\Controllers\Admin\SettingController::class, 'toggleMaintenance']);

        // Activity Logs
        Route::get('/activity-logs', [\App\Http\Controllers\Admin\DashboardController::class, 'activityLogs']);
    });
});
