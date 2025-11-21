<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CategoryField extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'label',
        'type',
        'required',
        'options',
        'help_text',
        'order',
    ];

    protected $casts = [
        'options' => 'array',
        'required' => 'boolean',
    ];

    /**
     * Get the category this field belongs to
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get available field types
     */
    public static function getTypes()
    {
        return ['text', 'textarea', 'number', 'select', 'file', 'date', 'email', 'checkbox', 'radio'];
    }
}
