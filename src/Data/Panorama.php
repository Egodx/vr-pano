<?php

namespace App\Data;

use Balping\HashSlug\HasHashSlug;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Panorama extends Model
{
    use HasHashSlug;

    protected $fillable = [
        'title',
        'public',
        'download',
    ];


    protected static function boot(){
        parent::boot();
        // Private panoramas hidden by default
        static::addGlobalScope('public', function (Builder $builder){
            $builder->where('public', 1);
        });

    }

    public function isPublic()
    {
        return (bool)$this->public;
    }

}
