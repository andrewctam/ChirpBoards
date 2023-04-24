package org.andrewtam.ChirpBoards.SQLModels;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

@Entity
@IdClass(VoteId.class)
@Table(name = "votes")
public class Vote {
    @Id
    private String post;
    @Id
    private String user;

    @Column(nullable = false)
    private boolean isUpvote;

    public Vote() {}

    public Vote(String post, String user, boolean isUpvote) {
        this.post = post;
        this.user = user;
        this.isUpvote = isUpvote;
    }

    public String getPost() { return this.post; }

    public void setPost(String post) { this.post = post; }

    public String getUser() { return this.user; }

    public void setUser(String user) { this.user = user; }

    public boolean isUpvote() { return this.isUpvote; }

    public void setIsUpvote(boolean isUpvote) { this.isUpvote = isUpvote; }

}

