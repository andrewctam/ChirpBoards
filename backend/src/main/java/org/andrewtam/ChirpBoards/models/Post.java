package org.andrewtam.ChirpBoards.models;

import java.sql.Date;
import java.util.LinkedList;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("posts")
public class Post {

    @Id
    private String id;
    private boolean isComment;
    private String text;
    private User author;
    private String postDate;
    private LinkedList<User> upvotes;
    private LinkedList<User> downvotes;

    private LinkedList<Post> comments;


    public Post(String text, User author, boolean isComment) {
        this.text = text;
        this.author = author;
        this.isComment = isComment;

        this.postDate = new Date(System.currentTimeMillis()).toString();
        this.upvotes = new LinkedList<User>();
        this.downvotes = new LinkedList<User>();

        this.comments = new LinkedList<Post>();
    }

    public String getId() { return id; }

    public boolean isComment() { return isComment; }

    public String getText() { return text; }
    
    public User getAuthor() { return author; }

    public String getPostDate() { return postDate; }

    public LinkedList<User> getUpvotes() { return upvotes; }

    public LinkedList<User> getDownvotes() { return downvotes; }

    public LinkedList<Post> getComments() { return comments; }
}
