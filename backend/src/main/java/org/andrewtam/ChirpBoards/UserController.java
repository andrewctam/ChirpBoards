package org.andrewtam.ChirpBoards;

import org.andrewtam.ChirpBoards.models.User;
import org.andrewtam.ChirpBoards.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class UserController {
    @Autowired
    private UserRepository userRepository;

    @QueryMapping
    public User user(@Argument String username) {
        return userRepository.findByUsername(username);
    }
    
    @MutationMapping
    public User createUser(@Argument String username) {
        if (userRepository.findByUsername(username) != null) {
            return null;
        }

        User user = new User(username, "pass");
        return userRepository.save(user);
    }
    
}
