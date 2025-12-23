import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Story from "../models/Story.js";
import User from "../models/User.js";
//import { inngest } from "../inngest/index.js";

// Add User Story
export const addUserStory = async (req, res) =>{
    try {
        const userId = req.userId;
        const {content, media_type, background_color} = req.body;
        const media = req.file
        let media_url = ''

        // upload media to imagekit
        if(media_type === 'image' || media_type === 'video'){
            const fileBuffer = fs.readFileSync(media.path)
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: media.originalname,
            })
            media_url = response.url
        }
        // create story
        const story = await Story.create({
            user: userId,
            content,
            media_url,
            media_type,
            background_color
        })

        // Populate user data
        const populatedStory = await Story.findById(story._id).populate('user');

        // schedule story deletion after 24 hours
        // await inngest.send({
        //     name: 'app/story.delete',
        //     data: { storyId: story._id }
        // })

        res.json({success: true, story: populatedStory})

    } catch (error) {
       console.log(error);
       res.json({ success: false, message: error.message }); 
    }
}

// Get User Stories
export const getStories = async (req, res) =>{
    try {
        const userId = req.userId;
        const user = await User.findById(userId)

        // User connections and followings 
        const userIds = [userId, ...user.connections, ...user.following]

        const stories = await Story.find({
            user: {$in: userIds}
        }).populate('user').sort({ createdAt: -1 });

        res.json({ success: true, stories }); 
    } catch (error) {
       console.log(error);
       res.json({ success: false, message: error.message }); 
    }
}

// Delete Story
export const deleteStory = async (req, res) => {
    try {
        const userId = req.userId;
        const { storyId } = req.params;

        // Find the story
        const story = await Story.findById(storyId);
        
        if (!story) {
            return res.status(404).json({
                success: false,
                message: "Story not found"
            });
        }

        // Check if the user owns the story
        if (story.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own stories"
            });
        }

        // Delete the story
        await Story.findByIdAndDelete(storyId);

        res.json({
            success: true,
            message: "Story deleted successfully"
        });

    } catch (error) {
        console.log('Delete story error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// View Story (increment view count)
export const viewStory = async (req, res) => {
    try {
        const userId = req.userId;
        const { storyId } = req.params;

        const story = await Story.findById(storyId);
        
        if (!story) {
            return res.status(404).json({
                success: false,
                message: "Story not found"
            });
        }

        // Add user to views if not already viewed
        if (!story.views_count.includes(userId)) {
            story.views_count.push(userId);
            await story.save();
        }

        res.json({
            success: true,
            message: "Story viewed",
            story
        });

    } catch (error) {
        console.log('View story error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}