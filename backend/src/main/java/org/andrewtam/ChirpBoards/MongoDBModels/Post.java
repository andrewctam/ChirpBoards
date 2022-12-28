package org.andrewtam.ChirpBoards.MongoDBModels;

import java.sql.Date;
import java.util.LinkedList;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("posts")
public class Post {

    @Id
    private ObjectId id;
    private boolean isComment;
    private String text;
    private ObjectId author; //reference to user
    private String postDate;
    private LinkedList<ObjectId> upvotes; //references to users
    private LinkedList<ObjectId> downvotes; //references to users

    private LinkedList<ObjectId> comments; //references to posts


    public Post(String text, ObjectId author, boolean isComment) {
        this.text = text;
        this.author = author;
        this.isComment = isComment;

        this.postDate = new Date(System.currentTimeMillis()).toString();
        this.upvotes = new LinkedList<ObjectId>();
        this.downvotes = new LinkedList<ObjectId>();

        this.comments = new LinkedList<ObjectId>();
    }

    public ObjectId getId() { return id; }

    public boolean isComment() { return isComment; }

    public String getText() { return text; }
    
    public ObjectId getAuthor() { return author; }

    public String getPostDate() { return postDate; }

    public LinkedList<ObjectId> getUpvotes() { return upvotes; }

    public LinkedList<ObjectId> getDownvotes() { return downvotes; }

    public LinkedList<ObjectId> getComments() { return comments; }

    public int hashcode() {
        return this.id.hashCode();
    }
}
