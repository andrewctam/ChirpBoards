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

    @Override
    public boolean equals(Object obj) {
        if (obj == this) return true;
        if (!(obj instanceof VoteId)) return false;

        VoteId voteId = (VoteId) obj;
        return voteId.post.equals(this.post) && voteId.user.equals(this.user);
    }

    @Override
    public int hashCode() {
        int result = 17;
        result = 31 * result + post.hashCode();
        result = 31 * result + user.hashCode();
        return result;
    }
}
