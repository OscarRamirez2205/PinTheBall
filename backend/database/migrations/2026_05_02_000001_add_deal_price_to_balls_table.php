<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('balls', function (Blueprint $table) {
            $table->unsignedInteger('deal_price')->nullable()->after('price');
        });
    }

    public function down(): void
    {
        Schema::table('balls', function (Blueprint $table) {
            $table->dropColumn('deal_price');
        });
    }
};
