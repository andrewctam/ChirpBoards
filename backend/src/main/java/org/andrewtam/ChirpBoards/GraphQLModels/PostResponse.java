package org.andrewtam.ChirpBoards.GraphQLModels;

import org.andrewtam.ChirpBoards.MongoDBModels.Post;

public class PostResponse {
    private String msg;
    private Post post;

    public PostResponse(String msg, Post post) {
        this.msg = msg;
        this.post = post;
    }

    public String getMsg() { return msg; }
    public Post getPost() { return post; }
    
}
