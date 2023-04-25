package org.andrewtam.ChirpBoards.SQLModels;

import java.io.Serializable;

public class VoteId implements Serializable {
    private String post;
    private String user;

    public VoteId() { }

    public VoteId(String post, String user) {
        this.post = post;
        this.user = user;
    }

    public String getPost() { return this.post; }

    public String getUser() { return this.user; }

    public void setPost(String post) {
        this.post = post;
    }

    public void setUser(String user) {
        this.user = user;
    }
}
