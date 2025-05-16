import express from "express";

import cloudinary from "../lib/cloudinary.js";
import Event from "../models/Event.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

//post

router.post("/", protectRoute, async (req, res) => {
  console.log("Incoming POST /events body:", req.body);
  try {
    const { title, caption, rating, image } = req.body;

    if (!image || !title || !caption || !rating) {
      return res.status(400).json({ message: "Please provide all the fields" });
    }

    //upload image to cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image);
    const imageUrl = uploadResponse.secure_url;

    //save to the database
    const newEvent = new Event({
      title,
      caption,
      rating,
      image: imageUrl,
      user: req.user._id,
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    console.log("Error Creating Event ", error);
    res.status(500).json({ message: error.message });
  }
});

//pagination => infinite loading
router.get("/", protectRoute, async (req, res) => {
  try {
    //example call from react native - front end
    //const response = await fetch("http://localhost:3000/api/books?page=1&limit=5")

    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    const skip = (page - 1) * limit;

    const events = await Event.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage");

    const totalBooks = await Event.countDocuments();
    res.send({
      books,
      currentPage: page,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.log("Error in  get event route", error);
    res.status(500).json({ message: "Internal server Error" });
  }
});

//recommended event by the logged user

router.get("/user", protectRoute, async (req, res) => {
  try {
    const events = await Event.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(events);
  } catch (error) {
    console.log("Get user event error", error.message);
    res.status(500).json({ message: "Internal server Error" });
  }
});

//delete endpoint

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    //check if user is the creator of this event

    if (event.user.toString() != req.user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    //delete image from cloudinary as well
    if (event.image && event.image.includes("cloudinary")) {
      try {
        const publicId = event.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.log("Error deleting image from cloudinary", deleteError);
      }
    }

    await event.deleteOne();

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.log("Error deleting book", error);
    res.status(500).json({ message: "Internal server Error" });
  }
});

export default router;
