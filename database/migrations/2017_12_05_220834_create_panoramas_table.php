<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreatePanoramasTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('panoramas', function (Blueprint $table) {
            $table->increments('id');
            $table->string('title');
            $table->string('manage_key')->nullable();
            $table->string('private_key')->nullable();
            $table->smallInteger('public')->default(0);
            $table->smallInteger('type')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('panoramas');
    }
}
