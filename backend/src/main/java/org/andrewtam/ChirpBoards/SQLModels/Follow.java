package org.andrewtam.ChirpBoards.SQLModels;


import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

@Entity
@IdClass(FollowId.class)
@Table(name = "follows")
public class Follow {
    @Id
    private String user;
    @Id
    private String target;

    public Follow() {}

    public Follow(String user, String target) {
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

}

