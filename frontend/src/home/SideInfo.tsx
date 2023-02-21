import { useContext, useEffect, useMemo, useState } from "react";
import { UserContext, UserPayload } from "../App";
import SuggestedUser from "./SuggestedUser";
import SpinningCircle from "../SpinningCircle"

export type UserToFollow = {
    username: string;
    displayName: string;
    userColor: string;
    relation: "no display" | "popular" | "follower" | "distant following";
    distant?: string;
    isFollowing?: boolean;
} 

interface CurrentUser {
    username: string;
    displayName: string;
    userColor: string;
    followerCount: number;
    followingCount: number;
    postCount: number;
}

const SideInfo = () => {
    const userInfo = useContext(UserContext);
    const [popularUsers, setPopularUsers] = useState<UserToFollow[]>([]);
    const [followersUsers, setFollowersUsers] = useState<UserToFollow[]>([]);
    const [distantFollowingUsers, setDistantFollowingUsers] = useState<UserToFollow[]>([]);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [doneLoading, setDoneLoading] = useState(false);

    useEffect(() => {
        if (userInfo.state.username) {
            getSuggested();
        } else {
            onlyGetPopular();
        }
    }, [])

    const getSuggested = async () => {
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query = `
            query {
                user(username: "${userInfo.state.username}") {
                    displayName
                    userColor
                    followerCount
                    followingCount
                    postCount
                    followers(pageNum: 0, size: 10) {
                        users {
                            username
                            displayName
                            userColor
                            isFollowing(followeeUsername: "${userInfo.state.username}")
                        }
                    }
                    following(pageNum: 0, size: 3) {
                        users {
                            username
                            following(pageNum: 0, size: 3) {
                                users {
                                    username
                                    displayName
                                    userColor
                                    isFollowing(followeeUsername: "${userInfo.state.username}")
                                }
                            }
                        }
                    }
                }
                popularUsers(num: 5) {
                    username
                    displayName
                    userColor
                    isFollowing(followeeUsername: "${userInfo.state.username}")
                }  
            }
        `
        const response = await fetch(url ?? '', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        }).then(res => res.json())
        console.log(response)
        setCurrentUser(response.data.user);

        const followers: UserPayload[] = response.data.user.followers.users;
        setFollowersUsers(followers.map((u) => {
            return {
                username: u.username,
                displayName: u.displayName,
                userColor: u.userColor,
                relation: "follower",
                isFollowing: u.isFollowing
            }
        }))

        const popular: UserPayload[] = response.data.popularUsers;
        setPopularUsers( popular.map(u => {
            return {
                username: u.username,
                displayName: u.displayName,
                userColor: u.userColor,
                relation: "popular",
                isFollowing: u.isFollowing
            }
        }))

        type NestedUserPayload = {
            username: string;
            displayName: string;
            userColor: string;
            following: {
                users: UserPayload[] //normal UserPayload doesn't have to access following.users
            }
        }

        const following: NestedUserPayload[] = response.data.user.following.users;
        const distantFollowing: UserToFollow[] = [];
        for (let i = 0; i < following.length; i++) {
            if (following[i].following.users.length === 0)
                continue;

            const user = following[i];
            
            for (let j = 0; j < user.following.users.length; j++) {
                const distant = user.following.users[j];
                distantFollowing.push({
                    username: distant.username,
                    displayName: distant.displayName,
                    userColor: distant.userColor,
                    relation: "distant following",
                    distant: user.username,
                    isFollowing: distant.isFollowing
                })
            }
            
        }

        setDistantFollowingUsers(distantFollowing);
        setDoneLoading(true);
    }

    const onlyGetPopular = async () => {
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query = `
            query {
                popularUsers(num: 5) {
                    username
                    displayName
                    userColor
                }  
            }
        `
        const response = await fetch(url ?? '', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        }).then(res => res.json())

        const users: UserPayload[] = response.data.popularUsers;

        setPopularUsers( users.map(user => {
            return {
                username: user.username,
                displayName: user.displayName,
                userColor: user.userColor,
                relation: "no display", //all popular, so no display
            }
        }))

        setDoneLoading(true);
    }


    
    const suggested = useMemo(() => {
        const seen = new Set();
        return popularUsers.concat(followersUsers, distantFollowingUsers)
                                .filter((u) => {
                                        if (seen.has(u.username)) {
                                            return false;
                                        }
                                        seen.add(u.username);

                                        return u.username != userInfo.state.username
                                }) //remove self and dupes
                                .slice(0, 10) 
                                .sort(() => Math.random() - 0.5); //shuffle
    }, [popularUsers, followersUsers, distantFollowingUsers])

                                

    if (!doneLoading)
        return <SpinningCircle />
        
    return (
        <div className="hidden md:block p-4 sticky top-16 h-fit">
            <div className="text-white text-center mt-8 mx-8 p-6 h-fit bg-black/20 rounded-2xl shadow-md">
                {userInfo.state.username && currentUser ? 
                <>
                    <div className ="text-lg">
                        Welcome Back 
                        <a style={{color: currentUser.userColor}} href={`./profile/${userInfo.state.username}`}>
                            {` ${currentUser.displayName}`}
                        </a>
                        !
                    </div>
                    <div className = "mt-4">
                        <span className="text-blue-200">Current Statistics:</span>
                        <div className="text-white text-sm">
                            {` ${currentUser.followerCount} follower${currentUser.followerCount === 1 ? "" : "s"}`}
                        </div>

                        <div className="text-white text-sm">
                            {` ${currentUser.followingCount} following`}
                        </div>

                        <div className="text-white text-sm">
                            {` ${currentUser.postCount} chirp${currentUser.postCount === 1 ? "" : "s"}`}
                        </div>
                    </div>
                </>
                :
                <>
                    Welcome to Chirp Boards!
                    <a href="./register" className="text-sky-200">{" Register "}</a> 
                    for an account to:
                    <ul className="list-disc text-left mx-auto w-fit">
                        <li>Create and rechirp chirps</li>
                        <li>Reply and cast votes</li>
                        <li>Follow other users</li>
                    </ul>
                </>
                }
            </div>

            <div className="text-white text-center mt-6 mx-8 p-6 h-fit bg-black/20 rounded-2xl shadow-md">
                <div className="text-lg">
                {userInfo.state.username ? 
                    "Suggested Users to Follow"
                    :
                    "Popular Users"
                }
                </div>
                
                {suggested.map((u, i) => {
                return <SuggestedUser 
                            key = {`suggested${i}`}
                            username={u.username}
                            displayName = {u.displayName}
                            userColor = {u.userColor}
                            relation={u.relation}
                            distant={u.distant}
                            isFollowing={u.isFollowing}
                            changeFollowingCount = {(i: number) => {
                                if (!currentUser) 
                                    return;
                                setCurrentUser({ ...currentUser, followingCount: currentUser.followingCount + i})
                            }}
                        />
            })}
            </div>  
        </div>
    )
}


export default SideInfo