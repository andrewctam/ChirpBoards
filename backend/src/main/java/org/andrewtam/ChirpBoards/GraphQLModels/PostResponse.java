package org.andrewtam.ChirpBoards.GraphQLModels;

import org.andrewtam.ChirpBoards.MongoDBModels.Post;

public class PostResponse {
    private String error;
    private Post post;

    public PostResponse(String error, Post post) {
        this.error = error;
        this.post = post;
    }

    public String getError() { return error; }
    public Post getPost() { return post; }
    
}
