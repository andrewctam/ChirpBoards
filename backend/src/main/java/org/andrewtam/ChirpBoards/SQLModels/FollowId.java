package org.andrewtam.ChirpBoards.SQLModels;

import java.io.Serializable;

public class FollowId implements Serializable {
    private String user;
    private String target;

    public FollowId() { }

    public FollowId(String user, String target) {
        this.user = user;
        this.target = target;
    }

    public String getUser() { return this.user; }

    public String getTarget() { return this.target; }

    public void setUser(String user) {
        this.user = user;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == this) return true;
        if (!(obj instanceof FollowId)) return false;

        FollowId followId = (FollowId) obj;
        return followId.user.equals(this.user) && followId.target.equals(this.target);
    }

    @Override
    public int hashCode() {
        int result = 17;
        result = 31 * result + user.hashCode();
        result = 31 * result + target.hashCode();
        return result;
    }
}
