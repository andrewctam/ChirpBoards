package org.andrewtam.ChirpBoards;

import java.util.Date;
import java.util.UUID;

import org.andrewtam.ChirpBoards.models.User;
import org.andrewtam.ChirpBoards.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Controller;

@Controller
public class UserController {
    final long FIFTEEN_MINS = 1000 * 60 * 15;

    @Autowired
    private UserRepository userRepository;

    @QueryMapping
    public User user(@Argument String username) {
        return userRepository.findByUsername(username);
    }
    
    @MutationMapping
    public String register(@Argument String username, @Argument String password) {
        if (userRepository.findByUsername(username) != null) {
            return null;
        }

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hashedPassword = encoder.encode(password);

        
        User user = new User(username, hashedPassword);

        String sessionToken = UUID.randomUUID().toString();
        user.setSessionToken(sessionToken);
        user.setSessionTokenExpiration(new Date( System.currentTimeMillis() + FIFTEEN_MINS ));
        
        userRepository.save(user);

        return sessionToken;
    }

    @MutationMapping
    public String signin(@Argument String username, @Argument String password) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            return null;
        }

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        if (!encoder.matches(password, user.getHashedPassword())) {
            return null;
        }

        String sessionToken = UUID.randomUUID().toString();
        user.setSessionToken(sessionToken);
        user.setSessionTokenExpiration(new Date( System.currentTimeMillis() + FIFTEEN_MINS ));

        userRepository.save(user);

        return sessionToken;
    }

    @MutationMapping
    public Boolean signout(@Argument String username, @Argument String sessionToken) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            return false;
        }

        if (!user.getSessionToken().equals(sessionToken) || 
            user.getSessionTokenExpiration().getTime() < System.currentTimeMillis()) {
            return false;
        }

        user.setSessionToken(null);
        user.setSessionTokenExpiration(null);

        userRepository.save(user);

        return true;
    }

    @MutationMapping
    public Boolean toggleFollow(@Argument String userToFollow, @Argument String username, @Argument String sessionToken) {
        User user = userRepository.findByUsername(username);
        User followUser = userRepository.findByUsername(userToFollow);

        if (user == null || followUser == null) {
            return null;
        }

        if (!user.getSessionToken().equals(sessionToken) || 
            user.getSessionTokenExpiration().getTime() < System.currentTimeMillis()) {
            return null;
        }

        boolean nowFollowing;

        if (user.getFollowing().remove(followUser)) {
            followUser.setFollowers((followUser.getFollowers() - 1));
            nowFollowing = false;
        } else {
            user.getFollowing().add(followUser);
            followUser.setFollowers((followUser.getFollowers() + 1));
            nowFollowing = true;
        }
        

        userRepository.save(user);
        userRepository.save(followUser);
        return nowFollowing;
    }

}
