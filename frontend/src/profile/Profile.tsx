
import { useState, useContext, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { UserContext, UserPayload } from "../App";
import PostComposer from "../home/PostComposer";
import Layout from "../Layout";
import ProfilePlaceholder from "../placeholders/ProfilePlaceholder";
import UserPhoto from "../UserPhoto";
import ProfileFeed from "./ProfileFeed";
import StatisticSwapper from "./StatisticSwapper";

export enum Feed {
    Chirps, Followers, Following
}

function Profile() {
    const userInfo = useContext(UserContext);
    const params = useParams();

    const [searchParams, setSearchParams] = useSearchParams();

    const [doneFetching, setDoneFetching] = useState(false);

    const [username, setUsername] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string>("");
    const [pictureURL, setPictureURL] = useState<string>("");
    const [postCount, setPostCount] = useState(0);
    const [followerCount, setFollowerCount] = useState<number>(0);
    const [followingCount, setFollowingCount] = useState<number>(0);


    const [userColor, setUserColor] = useState<string>("#000000")
    const [editingColor, setEditingColor] = useState(false);

    const [isFollowing, setIsFollowing] = useState(false);
    const [currentlySending, setCurrentlySending] = useState(false);

    const [selectedFeed, setSelectedFeed] = useState<Feed>(Feed.Chirps);

    const [showSettingsCog, setShowSettingsCog] = useState(false);


    const navigate = useNavigate();

    useEffect(() => {
        if (params && params.username) {
            getUserInfo(params.username);
        }

        if (searchParams.get("editColor")) {
            setEditingColor(true);
            setSearchParams("")
        }

        switch (searchParams.get("feed")) {
            case "followers":
                setSelectedFeed(Feed.Followers);
                break;
            case "following":
                setSelectedFeed(Feed.Following);
                break;
            default:
                setSelectedFeed(Feed.Chirps);
                break;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const switchFeeds = (feed: Feed) => {
        setSelectedFeed(feed);
        setSearchParams({ feed: 
            feed === Feed.Followers ? "followers" :
            feed === Feed.Following ? "following" :
                                      "chirps"
        });
    }


    const getUserInfo = async (username: string) => {
        const url = import.meta.env.DEV ? import.meta.env.VITE_DEV_URL : import.meta.env.VITE_PROD_URL

        const query =
            `query {    
            user(username: "${username}") {
                username
                displayName
                pictureURL
                followerCount
                followingCount
                postCount
                userColor
                ${userInfo.state.username ? `isFollowing(followerUsername: "${userInfo.state.username}")` : ""}
            }
        }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        }).then(res => res.json())

        setDoneFetching(true)
        console.log(response)
        const info: UserPayload = response.data.user
        if (info === null) {
            return
        }

        setUsername(info.username)
        setDisplayName(info.displayName)
        setPictureURL(info.pictureURL)
        setFollowerCount(info.followerCount)
        setFollowingCount(info.followingCount)
        setPostCount(info.postCount)
        setUserColor(info.userColor)

        if (userInfo.state.username)
            setIsFollowing(info.isFollowing)
    }


    const toggleFollow = async () => {
        if (!userInfo.state.username) {
            navigate(`/signin`)
        }

        const url = import.meta.env.DEV ? import.meta.env.VITE_DEV_URL : import.meta.env.VITE_PROD_URL

        const query =
            `mutation {    
            toggleFollow(userToFollow: "${username}", username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}") {
                msg
                endRes
            }
        }`

        //optimistic update
        if (currentlySending) {
            return;
        } else if (isFollowing) {
            setFollowerCount(followerCount - 1);
            setIsFollowing(false);
        } else {
            setFollowerCount(followerCount + 1);
            setIsFollowing(true);
        }

            
        setCurrentlySending(true);
        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        }).then(res => res.json())
        setCurrentlySending(false);

        console.log(response)
    }


    const updateUserColor = async () => {
        const url = import.meta.env.DEV ? import.meta.env.VITE_DEV_URL : import.meta.env.VITE_PROD_URL
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
            body: JSON.stringify({ query })
        }).then(res => res.json())
        console.log(response)

        window.location.reload()
    }


    if (!doneFetching && username === null) { //first load
        return (<Layout>
           <ProfilePlaceholder />
        </Layout>);

    } else if (doneFetching && username === null) { //first load done, but user not found
        return (<Layout>
            <div className="text-center bg-red-200 py-8 shadow-md">
                <h1>{`User ${params.username} not Found`}</h1>
            </div>
        </Layout>);
}
    return (<Layout>
        <div className="text-center p-4 shadow-md relative" style={{ backgroundColor: userColor }} 
            onMouseEnter = {() => {setShowSettingsCog(true)}}
            onMouseLeave = {() => {setShowSettingsCog(false)}}>

            {editingColor ?
                <div className="absolute top-1 left-1 w-fit text-center border border-black/30 bg-black/80 shadow-md rounded-xl px-4 py-2">
                    <p className="text-white">Click below to select a new color</p>
                    <input type="color" className="bg-transparent block mx-auto w-16 h-16" value={userColor} onChange={(e) => setUserColor(e.target.value)} />
                    <button onClick={() => { navigate("/settings") }} className="text-sm text-white px-4 py-2 mx-auto my-2 mr-2 bg-rose-700/30 rounded-xl border border-black/50">
                        Cancel
                    </button>
                    <button onClick={updateUserColor} className="text-sm text-white px-4 py-2 mx-auto my-2 bg-white/10 rounded-xl border border-black/50">
                        Save Changes
                    </button>
                </div> 
            : null}

            {showSettingsCog && userInfo.state.username === username ? 
                <a href="/settings" className="absolute right-1 top-1">
                    <SettingsCog />
                </a>
            : null}

            <UserPhoto
                userColor={userColor}
                url={pictureURL}
                size={100} />


            <div className="flex justify-center gap-4 my-2">
                <div className="h-[70px] text-sm w-fit my-auto border border-white/10 text-black bg-slate-200/50 px-4 py-1 rounded-xl">
                    <h1 className="text-3xl break-words">{displayName}</h1>
                    <h1 className="text-sm">{`@${username}`}</h1>
                </div>

                <div className="h-[70px] text-sm w-fit my-auto border border-white/10 text-black bg-slate-200/50 px-4 py-1 rounded-xl">
                    <StatisticSwapper selectedFeed={selectedFeed} switchFeeds={switchFeeds}
                        type={Feed.Chirps}
                        text={`${postCount} chirp${postCount !== 1 ? "s" : ""}`}
                    />

                    <StatisticSwapper selectedFeed={selectedFeed} switchFeeds={switchFeeds}
                        type={Feed.Followers}
                        text={`${followerCount} follower${followerCount !== 1 ? "s" : ""}`}
                    />

                    <StatisticSwapper selectedFeed={selectedFeed} switchFeeds={switchFeeds}
                        type={Feed.Following}
                        text={`${followingCount} following`}
                    />
                </div>
            </div>

            {userInfo.state.username !== username ?
                <button onClick={toggleFollow} className={`inline text-black border border-black/25 px-4 py-2 mt-2 w-fit h-fit my-auto text-sm rounded-lg ${isFollowing ? "bg-rose-200/75" : "bg-green-100/75"}`}>
                    {isFollowing ? "Unfollow" : "Follow"}
                </button>
            : null}
        </div>

        {userInfo.state.username === username && selectedFeed === Feed.Chirps ?
            <div className="w-full bg-black/30 shadow-md pt-8 pb-1">
                <div className="mx-auto w-11/12 md:w-3/4 lg:w-3/5">
                    <PostComposer />
                </div>
            </div>
        : <div />}

        <ProfileFeed
            username={username ?? ""}
            selectedFeed={selectedFeed}
        />
    
    </Layout>);

}

const SettingsCog = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg"  width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"></path>
            <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path>
        </svg>
    )
}

export default Profile