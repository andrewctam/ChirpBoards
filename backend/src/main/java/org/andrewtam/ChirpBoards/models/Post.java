package org.andrewtam.ChirpBoards.models;

import java.sql.Date;

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
    private User[] upvotes;
    private User[] downvotes;

    private Post[] comments;


    public Post(String text, User author, boolean isComment) {
        this.text = text;
        this.author = author;
        this.isComment = isComment;

        this.postDate = new Date(System.currentTimeMillis()).toString();
        this.upvotes = new User[0];
        this.downvotes = new User[0];

        this.comments = new Post[0];
    }

    public String getId() { return id; }

    public boolean isComment() { return isComment; }

    public String getText() { return text; }
    
    public User getAuthor() { return author; }

    public String getPostDate() { return postDate; }

    public User[] getUpvotes() { return upvotes; }
    public void setUpvotes(User[] upvotes) { this.upvotes = upvotes; }

    public User[] getDownvotes() { return downvotes; }
    public void setDownvotes(User[] downvotes) { this.downvotes = downvotes; }
    

    public Post[] getComments() { return comments; }
    public void setComments(Post[] comments) { this.comments = comments; }
}
