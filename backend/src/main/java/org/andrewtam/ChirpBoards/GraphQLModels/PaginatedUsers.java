package org.andrewtam.ChirpBoards.GraphQLModels;

import java.util.ArrayList;
import java.util.List;

import org.andrewtam.ChirpBoards.SQLModels.User;
import org.springframework.data.domain.Page;

public class PaginatedUsers {

    private List<User> users;
    private Boolean hasNext;


    public PaginatedUsers(Page<User> pagable) {
        if (pagable == null) {
            users = new ArrayList<>();
            hasNext = false;
        } else {
            this.users = pagable.getContent();
            this.hasNext = pagable.hasNext();
        }
    }

    public List<User> getUsers() { return users; }
    public Boolean getHasNext() { return hasNext; }
    
}
