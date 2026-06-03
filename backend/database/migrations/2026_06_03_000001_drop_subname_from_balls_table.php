<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasColumn('balls', 'subname')) {
            return;
        }

        Schema::table('balls', function (Blueprint $table) {
            $table->dropColumn('subname');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('balls', 'subname')) {
            return;
        }

        Schema::table('balls', function (Blueprint $table) {
            $table->string('subname')->nullable()->after('name');
        });
    }
};
