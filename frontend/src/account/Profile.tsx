import { editableInputTypes } from "@testing-library/user-event/dist/utils";
import { useState, useContext, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PostPayload, UserContext, UserPayload } from "../App";
import Chirp from "../home/Chirp";
import PostComposer from "../home/PostComposer";
import useScrollBottom from "../hooks/useScrollBottom";
import useSort, { SortMethod } from "../hooks/useSort";
import Layout from "../Layout";
import UserSearchResult from "../menus/UserSearchResult";
import SpinningCircle from "../SpinningCircle";

enum View {
    Chirps, Followers, Following
}

function Profile () {
    const userInfo = useContext(UserContext);
    const params = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [doneFetching, setDoneFetching] = useState(false);

    const [username, setUsername] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string>("");

    const [postCount, setPostCount] = useState(0);
    const [followerCount, setFollowerCount] = useState<number>(0);
    const [followingCount, setFollowingCount] = useState<number>(0);

    const [pinnedPostId, setPinnedPostId] = useState("")
    const [pinnedPost, setPinnedPost] = useState<JSX.Element | null>(null);

    const [userColor, setUserColor] = useState<string>("#000000")
    const [editingColor, setEditingColor] = useState(false);
    
    const [isFollowing, setIsFollowing] = useState(false);

    const [viewSelected, setViewSelected] = useState<View>(View.Chirps);

    const [chirps, setChirps] = useState<JSX.Element[]>([]);
    const [chirpsPageNum, setChirpsPageNum] = useState(0);
    const [chirpsHasNextPage, setChirpsHasNextPage] = useState(true);

    const [followers, setFollowers] = useState<JSX.Element[]>([]);
    const [followersPageNum, setFollowersPageNum] = useState(0);
    const [followersHasNextPage, setFollowersHasNextPage] = useState(true);

    const [following, setFollowing] = useState<JSX.Element[]>([]);
    const [followingPageNum, setFollowingPageNum] = useState(0);
    const [followingHasNextPage, setFollowingHasNextPage] = useState(true);

    const navigate = useNavigate();

    useEffect( () => {
        if (params && params.username) {
            getUserInfo(params.username);
        }
        
        if (searchParams.get("editColor")) {
            setEditingColor(true);
            setSearchParams("")
        }

        switch(searchParams.get("view")) {
            case "followers":
                setViewSelected(View.Followers);
                break;
            case "following":
                setViewSelected(View.Following);
                break;
            default:
                setViewSelected(View.Chirps);
                break;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] )


    useEffect(() => {
        if (username && postCount > 0) {
            setDoneFetching(false)
            getChirps(); // separate getting chirps to speed up initial load
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username, editingColor])

    useEffect(() => {
        if (viewSelected !== View.Chirps) {
            setDoneFetching(false)
            getFollowerIng();
        }
    }, [viewSelected])


    const getUserInfo = async (username: string) => {
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()

        const query =
        `query {    
            user(username: "${username}"${userInfo.state.username ? `, relatedUsername: "${userInfo.state.username}"` : ""}) {
                username
                displayName
                followerCount
                followingCount
                postCount
                userColor
                pinnedPost {
                    id
                    text
                    isEdited
                    postDate(timezone: ${timezone})
                    score
                    ${userInfo.state.username ? "voteStatus" : ""}
                }
                ${userInfo.state.username ? `isFollowing(followeeUsername: "${userInfo.state.username}")` : ""}
            }
        }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({query})
        }).then(res => res.json())

        setDoneFetching(true)
        console.log(response)
        const info: UserPayload = response.data.user
        if (info === null) {
            return
        }

        setUsername(info.username)
        setDisplayName(info.displayName)
        setFollowerCount(info.followerCount)
        setFollowingCount(info.followingCount)
        setPostCount(info.postCount)
        setUserColor(info.userColor)

        if (info.pinnedPost !== null) {
            setPinnedPostId(info.pinnedPost.id)
            setPinnedPost(
                <Chirp
                    authorUsername={info.username}
                    authorDisplayName={info.displayName}
                    id = {info.pinnedPost.id}
                    postDate = {info.pinnedPost.postDate}
                    text = {info.pinnedPost.text}
                    key = {info.pinnedPost.id}
                    score = {info.pinnedPost.score}
                    voteStatus = {userInfo.state.username ? info.pinnedPost.voteStatus : 0}
                    userColor = {info.userColor}
                    isEdited = {info.pinnedPost.isEdited}
                    pinned = {true}
            />)
           
        }

        
        if (userInfo.state.username)
            setIsFollowing(info.isFollowing)
    }


     
    const getChirps = async () => {
        if (!chirpsHasNextPage) {
            setDoneFetching(true);
            return;
        }

        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `query {    
            user(username: "${username}"${userInfo.state.username ? `, relatedUsername: "${userInfo.state.username}"` : ""}) {
                posts(pageNum: ${chirpsPageNum}, size:10, sortMethod: "${sortMethod}") {
                    posts {
                        id
                        text
                        isEdited
                        postDate(timezone: ${timezone})
                        score
                        ${userInfo.state.username ? "voteStatus" : ""}
                    }
                    hasNext
                }
            }
        }`

        
        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({query})
        }).then(res => res.json())
        
        console.log(response)

        setChirpsPageNum(chirpsPageNum + 1)
        setDoneFetching(true);

        const info = response.data.user;
        setChirpsHasNextPage(info.posts.hasNext)
        setChirps(chirps.concat(info.posts.posts.map((post: PostPayload) => {
            if (post.id === pinnedPostId)
                return null;

            return <Chirp
                    authorUsername={username ?? ""}
                    authorDisplayName={displayName}
                    id = {post.id}
                    postDate = {post.postDate}
                    text = {post.text}
                    key = {post.id}
                    score = {post.score}
                    voteStatus = {userInfo.state.username ? post.voteStatus : 0}
                    userColor = {userColor}
                    isEdited = {post.isEdited}
                    pinned = {false}
                />
        })))
    }

    //gets followers or following
    const getFollowerIng = async () => {
        let type = "";
        let pageNum = 0

        switch(viewSelected) {
            case View.Followers:
                if (!followersHasNextPage) {
                    setDoneFetching(true);
                    return;
                }
                type = "followers";
                pageNum = followersPageNum
                break;
            case View.Following:
                if (!followingHasNextPage) {
                    setDoneFetching(true);
                    return;
                }
                type = "following";
                pageNum = followingPageNum
                break;
            default:
                setDoneFetching(true)
                return;
        }

        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
            `query {
                user(username: "${username}") {
                    ${type}(pageNum: ${pageNum}, size: 10) {
                        users {
                            username
                            displayName
                            userColor
                            postCount
                            followerCount
                            followingCount
                        }
                        hasNext
                    }
                }
            }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        }).then(res => res.json())

        setDoneFetching(true)
        console.log(response)
        const info = response.data.user[type];
        const fetchedUsers = info.users.map((user: UserPayload) => {
            return <UserSearchResult
                    username={user.username}
                    displayName={user.displayName}
                    userColor={user.userColor}
                    postCount={user.postCount}
                    followerCount={user.followerCount}
                    followingCount={user.followingCount}
                    key={type + user.username}/>
        })

        if (type === "followers") {
            setFollowersHasNextPage(info.hasNext)
            setFollowersPageNum(followersPageNum + 1)
            setFollowers(followers.concat(fetchedUsers))
        } else if (type  === "following") {
            setFollowingHasNextPage(info.hasNext)
            setFollowingPageNum(followingPageNum + 1)
            setFollowing(following.concat(fetchedUsers))
        }
        
    }
    
    const toggleFollow = async () => {
        if (!userInfo.state.username) {
            navigate(`/signin?return=${window.location.pathname}`)
        }
         
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL

        const query =
        `mutation {    
            toggleFollow(userToFollow: "${username}", username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}") {
                msg
                endRes
            }
        }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({query})
        }).then(res => res.json())

        console.log(response)

        setFollowerCount(response.data.toggleFollow.msg)
        setIsFollowing(!isFollowing)
    }

    
    const updateUserColor = async () => {
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query = 
        `mutation {
            changeUserColor(newUserColor: "${userColor}", username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}") {
                msg
                endRes
            }
        }`
        const response = await fetch(url ?? '', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({query})
        }).then(res => res.json())
        console.log(response)

        window.location.reload()
    }


    const textColor = (): "black" | "white" => {
        const r = parseInt(userColor.substring(1,3), 16);
        const g = parseInt(userColor.substring(3,5), 16);
        const b = parseInt(userColor.substring(5,7), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        return brightness > 125 ? "black" : "white";
    }


    let feed = null;
    switch (viewSelected) {
        case View.Chirps:
            if (chirpsPageNum > 0 && chirps.length === 0)
                feed = <div className = "text-center text-white text-lg">{`${username} has not made any chirps`}</div>
            else
                feed = <>{pinnedPost}{chirps}</>
            break;

        case View.Followers:
            if (followersPageNum > 0 && followers.length === 0)
                feed = <div className = "text-center text-white text-lg">{`${username} has no followers. Why not be the first one?`}</div>
            else
                feed = followers
            break;

        
        case View.Following:
            if (followingPageNum > 0 && following.length === 0)
                feed = <div className = "text-center text-white text-lg">{`${username} is not following any users`}</div>
            else
                feed = following
            break;

        default:
            break;
    }

    const [sortMethod, sortBubble] = useSort(doneFetching, getChirps, () => {
        setChirps([])
        setChirpsPageNum(0)
        setChirpsHasNextPage(true);
        setDoneFetching(false)
    })

    useScrollBottom(() => {
        setDoneFetching(false)
        
        switch(viewSelected) {
            case View.Followers:
            case View.Following:
                getFollowerIng();
                break;
                    
            case View.Chirps:
            default:
                getChirps()
                break;
        }
    })


    if (!doneFetching && username === null) //first load
        return <Layout><SpinningCircle /></Layout>
    else if (doneFetching && username === null) { //first load done, but user not found
        return (<Layout>
            <div className = "text-center bg-red-200 py-8 shadow-md">
                <h1>{`User ${params.username} not Found`}</h1>
            </div>
        </Layout>)
    } else
        return (<Layout>
            <div className = "text-center p-2 shadow-md" style = {{
                backgroundColor: userColor,
                color: textColor()
            }}>
                {viewSelected === View.Chirps && !editingColor ? sortBubble : null}

                <h1 className = "text-3xl break-words">{displayName}</h1>
                <h1 className = "text-sm">{`@${username}`}</h1>

                <div className = "mx-auto flex justify-center mt-3 w-fit">

                    <div className = "text-sm w-fit my-auto border border-white/10 text-black bg-slate-200/50 px-4 py-1 rounded-xl">
                        <div className={`w-fit mx-auto cursor-pointer select-none ${viewSelected === View.Chirps ?  "text-[#b22222]": "text-black"}`} onClick = {() => setViewSelected(View.Chirps)}>
                            {`${postCount} chirp${postCount !== 1 ? "s" : ""}` }
                        </div>

                        <div className={`w-fit mx-auto cursor-pointer select-none ${viewSelected === View.Followers ?  "text-[#b22222]": "text-black"}`} onClick = {() => setViewSelected(View.Followers)}>
                        {`${followerCount} follower${followerCount !== 1 ? "s" : ""}` }
                        </div>

                        <div className={`w-fit mx-auto cursor-pointer select-none ${viewSelected === View.Following ?  "text-[#b22222]": "text-black"}`} onClick = {() => setViewSelected(View.Following)}>
                            {`${followingCount} following`}
                        </div>

                    </div>

                    {userInfo.state.username !== username ? 
                    <button onClick = {toggleFollow} className = {`inline text-black px-4 py-2 w-fit h-fit ml-6 my-auto text-sm border border-black/20 rounded-lg ${isFollowing ? "bg-rose-200/75" : "bg-green-100/75"}`}>
                        {isFollowing ? "Unfollow" : "Follow" }
                    </button>   
                    : null}
                </div>
            </div>

            {userInfo.state.username === username && viewSelected === View.Chirps ? 
                <div className = "w-full bg-black/30 shadow-md pt-8 pb-1">
                    <div className = "mx-auto w-11/12 md:w-3/4 lg:w-3/5">
                        <PostComposer />
                    </div>
                </div> 
            : <div />}

            <div className = "mt-4 mx-auto w-11/12 md:w-3/4 lg:w-3/5">
                <ul className = "mt-4">
                    {feed}

                    {!doneFetching ? <SpinningCircle /> : null}
                </ul>
            </div>



        {editingColor ? 
            <div className = "fixed bottom-2 right-2 w-fit text-center border border-black/30 bg-black/60 shadow-md rounded-xl p-4">
                <p className = "text-white">Click below to select a new color</p>
                <input type = "color" className = "bg-transparent block mx-auto w-16 h-16" value = {userColor} onChange = {(e) => setUserColor(e.target.value)} />
                <button onClick = {() => {navigate("/settings")}} className = "text-sm text-white px-4 py-2 mx-auto my-2 mr-2 bg-rose-700/30 rounded-xl border border-black/50">
                    Cancel
                </button>
                <button onClick = {updateUserColor} className = "text-sm text-white px-4 py-2 mx-auto my-2 bg-white/10 rounded-xl border border-black/50">
                    Save Changes
                </button>

            </div> : null}

        </Layout>)

}

export default Profile