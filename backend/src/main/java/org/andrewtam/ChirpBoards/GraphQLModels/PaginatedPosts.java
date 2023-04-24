package org.andrewtam.ChirpBoards.GraphQLModels;

import java.util.ArrayList;
import java.util.List;

import org.andrewtam.ChirpBoards.SQLModels.Post;
import org.springframework.data.domain.Page;

public class PaginatedPosts {

    private List<Post> posts;
    private Boolean hasNext;


    public PaginatedPosts(Page<Post> pagable) {
        if (pagable == null) {
            posts = new ArrayList<>();
            hasNext = false;
        } else {
            this.posts = pagable.getContent();
            this.hasNext = pagable.hasNext();
        }
    }

    public List<Post> getPosts() { return posts; }
    public Boolean getHasNext() { return hasNext; }
    
}
