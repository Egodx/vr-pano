<?php

/*
|--------------------------------------------------------------------------
| Model Factories
|--------------------------------------------------------------------------
|
| Here you may define all of your model factories. Model factories give
| you a convenient way to create models for testing and seeding your
| database. Just tell the factory how a default model should look.
|
 */

$factory->define(\App\Data\User::class, function (Faker\Generator $faker) {
    /**
     * @var string
     */
    static $password;

    return [
        'name'           => $faker->name,
        'email'          => $faker->safeEmail,
        'password'       => $password ?: $password = bcrypt('secret'),
        'remember_token' => str_random(10)
    ];
});

$factory->define(\App\Data\Panorama::class, function (Faker\Generator $faker) {

    return [
        'title' => 'Test-'. $faker->sentence(),
        'public' => 1,
        'manage_key' => $faker->bothify('key-?#?#?#'),
        'type' => 0,
        'created_at' => $faker->dateTimeThisYear(),
        'updated_at' => $faker->dateTimeThisYear()


    ];
});
