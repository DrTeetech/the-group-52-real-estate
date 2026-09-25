const mongoose = require("mongoose");
const slugify = require("slugify");

const propertySchema = new mongoose.Schema(
  {
    // =========================================================
    // PROPERTY IDENTIFICATION
    // =========================================================

    propertyCode: {
      type: String,
      required: [true, "Property code is required"],
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },

    title: {
      type: String,
      required: [true, "Property title is required"],
      trim: true,
      minlength: [5, "Property title must be at least 5 characters"],
      maxlength: [150, "Property title cannot exceed 150 characters"],
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      required: [true, "Property description is required"],
      trim: true,
      minlength: [20, "Property description must be at least 20 characters"],
      maxlength: [5000, "Property description cannot exceed 5000 characters"],
    },

    // =========================================================
    // PROPERTY TYPE
    // =========================================================

    propertyType: {
      type: String,
      required: [true, "Property type is required"],
      enum: [
        "apartment",
        "duplex",
        "house",
        "bungalow",
        "terrace",
        "penthouse",
        "studio",
        "land",
        "commercial",
      ],
      lowercase: true,
      trim: true,
      index: true,
    },

    // =========================================================
    // RENTAL PRICING
    // =========================================================

    rent: {
      amount: {
        type: Number,
        required: [true, "Rent amount is required"],
        min: [0, "Rent cannot be negative"],
      },

      period: {
        type: String,
        enum: ["monthly", "yearly"],
        default: "yearly",
      },

      currency: {
        type: String,
        enum: ["NGN", "USD"],
        default: "NGN",
      },
    },

    serviceCharge: {
      amount: {
        type: Number,
        min: [0, "Service charge cannot be negative"],
        default: 0,
      },

      period: {
        type: String,
        enum: ["monthly", "yearly"],
        default: "yearly",
      },

      currency: {
        type: String,
        enum: ["NGN", "USD"],
        default: "NGN",
      },
    },

    cautionFee: {
      amount: {
        type: Number,
        min: [0, "Caution fee cannot be negative"],
        default: 0,
      },

      currency: {
        type: String,
        enum: ["NGN", "USD"],
        default: "NGN",
      },
    },

    // =========================================================
    // LOCATION
    // =========================================================

    location: {
      address: {
        type: String,
        trim: true,
      },

      area: {
        type: String,
        required: [true, "Property area is required"],
        trim: true,
        index: true,
      },

      city: {
        type: String,
        required: [true, "Property city is required"],
        trim: true,
        index: true,
      },

      state: {
        type: String,
        required: [true, "Property state is required"],
        trim: true,
        index: true,
      },

      country: {
        type: String,
        default: "Nigeria",
        trim: true,
      },

      landmark: {
        type: String,
        trim: true,
      },

      geometry: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },

        coordinates: {
          type: [Number],
        },
      },
    },

    // =========================================================
    // PROPERTY DETAILS
    // =========================================================

    bedrooms: {
      type: Number,
      min: [0, "Bedrooms cannot be negative"],
    },

    bathrooms: {
      type: Number,
      min: [0, "Bathrooms cannot be negative"],
    },

    parkingSpaces: {
      type: Number,
      min: [0, "Parking spaces cannot be negative"],
    },

    propertySize: {
      value: {
        type: Number,
        min: [0, "Property size cannot be negative"],
      },

      unit: {
        type: String,
        enum: ["sqm", "sqft"],
        default: "sqm",
      },
    },

    furnished: {
      type: Boolean,
      default: false,
    },

    yearBuilt: {
      type: Number,
      min: 1800,
    },

    floor: {
      type: Number,
      min: 0,
    },

    totalFloors: {
      type: Number,
      min: 0,
    },

    condition: {
      type: String,
      enum: ["new", "excellent", "good", "fair", "needs_renovation"],
    },

    // =========================================================
    // AMENITIES
    // =========================================================

    amenities: [
      {
        type: String,
        trim: true,
        maxlength: 100,
      },
    ],

    // =========================================================
    // MEDIA
    // =========================================================

    media: [
      {
        type: {
          type: String,
          enum: ["image", "video", "floorplan"],
          required: true,
        },

        url: {
          type: String,
          required: true,
        },

        publicId: String,

        isFeatured: {
          type: Boolean,
          default: false,
        },

        sortOrder: {
          type: Number,
          default: 0,
        },
      },
    ],

    // =========================================================
    // RENTAL AVAILABILITY
    // =========================================================

    status: {
      type: String,
      enum: ["draft", "available", "reserved", "rented", "unavailable"],
      default: "draft",
      index: true,
    },

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    // =========================================================
    // INTERNAL COMPANY MANAGEMENT
    // =========================================================

    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    // =========================================================
    // ANALYTICS
    // =========================================================

    views: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// =============================================================
// SLUG GENERATION
// =============================================================

propertySchema.pre("validate", function (next) {
  if (this.isModified("title") || !this.slug) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
    });
  }

  next();
});

// =============================================================
// INDEXES
// =============================================================

// GeoJSON search
propertySchema.index({
  "location.geometry": "2dsphere",
});

// Main property listing/filtering
propertySchema.index({
  visibility: 1,
  status: 1,
  propertyType: 1,
  "location.city": 1,
});

// Rental price filtering
propertySchema.index({
  visibility: 1,
  "rent.amount": 1,
});

// Rental availability
propertySchema.index({
  status: 1,
  "rent.amount": 1,
});

const Property = mongoose.model("Property", propertySchema);

module.exports = Property;
