
import { useState, useContext, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PostPayload, UserContext, UserPayload } from "../App";
import Chirp, { Rechirper } from "../home/Chirp";
import PostComposer from "../home/PostComposer";
import useScrollBottom from "../hooks/useScrollBottom";
import useSort from "../hooks/useSort";
import Layout from "../Layout";
import UserSearchResult from "../menus/UserSearchResult";
import ChirpPlaceholder from "../placeholders/ChirpPlaceholder";
import ProfilePlaceholder from "../placeholders/ProfilePlaceholder";
import SpinningCircle from "../SpinningCircle";
import UserPhoto from "../UserPhoto";

enum View {
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

    const [pinnedPostId, setPinnedPostId] = useState("")
    const [pinnedPost, setPinnedPost] = useState<JSX.Element | null>(null);

    const [userColor, setUserColor] = useState<string>("#000000")
    const [editingColor, setEditingColor] = useState(false);

    const [isFollowing, setIsFollowing] = useState(false);

    const [viewSelected, setViewSelected] = useState<View>(View.Chirps);

    const [chirps, setChirps] = useState<(JSX.Element | null)[]>([]);
    const [chirpsPageNum, setChirpsPageNum] = useState(0);
    const [chirpsHasNextPage, setChirpsHasNextPage] = useState(true);

    const [followers, setFollowers] = useState<JSX.Element[]>([]);
    const [followersPageNum, setFollowersPageNum] = useState(0);
    const [followersHasNextPage, setFollowersHasNextPage] = useState(true);

    const [following, setFollowing] = useState<JSX.Element[]>([]);
    const [followingPageNum, setFollowingPageNum] = useState(0);
    const [followingHasNextPage, setFollowingHasNextPage] = useState(true);

    const [showSetting, setShowSetting] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (params && params.username) {
            getUserInfo(params.username);
        }

        if (searchParams.get("editColor")) {
            setEditingColor(true);
            setSearchParams("")
        }

        switch (searchParams.get("view")) {
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
    }, [])


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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewSelected])


    const getUserInfo = async (username: string) => {
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()

        const query =
            `query {    
            user(username: "${username}"${userInfo.state.username ? `, relatedUsername: "${userInfo.state.username}"` : ""}) {
                username
                displayName
                pictureURL
                followerCount
                followingCount
                postCount
                userColor
                pinnedPost {
                    id
                    text
                    isEdited
                    imageURL
                    postDate(timezone: ${timezone})
                    score
                    ${userInfo.state.username ? "voteStatus" : ""}
                    ${userInfo.state.username ? "rechirpStatus" : ""}
                }
                ${userInfo.state.username ? `isFollowing(followeeUsername: "${userInfo.state.username}")` : ""}
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

        if (info.pinnedPost !== null) {
            setPinnedPostId(info.pinnedPost.id)
            setPinnedPost(
                <Chirp
                    authorUsername={info.username}
                    authorDisplayName={info.displayName}
                    authorPictureURL={info.pictureURL}
                    id={info.pinnedPost.id}
                    postDate={info.pinnedPost.postDate}
                    text={info.pinnedPost.text}
                    imageURL={info.pinnedPost.imageURL}
                    key={info.pinnedPost.id}
                    score={info.pinnedPost.score}
                    voteStatus={userInfo.state.username ? info.pinnedPost.voteStatus : 0}
                    rechirpStatus={userInfo.state.username ? info.pinnedPost.rechirpStatus : false}
                    userColor={info.userColor}
                    isEdited={info.pinnedPost.isEdited}
                    pinned={true}
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
                posts(pageNum: ${chirpsPageNum}, size:10, sortMethod: "${sortMethod}", sortDirection: "${sortDirection}") {
                    posts {
                        author {
                            username
                            displayName
                            userColor
                            pictureURL
                        }
                        id
                        text
                        imageURL
                        isEdited
                        
                        postDate(timezone: ${timezone})
                        score
                        ${userInfo.state.username ? "voteStatus" : ""}
                        ${userInfo.state.username ? "rechirpStatus" : ""}

                        isRechirp
                        rootPost {
                            author {
                                username
                                displayName
                                userColor
                            }
                            id
                            text
                            imageURL
                            isEdited
                            
                            postDate(timezone: ${timezone})
                            score
                            ${userInfo.state.username ? "voteStatus" : ""}
                            ${userInfo.state.username ? "rechirpStatus" : ""}
                        }

                    }
                    hasNext
                }
            }
        }`


        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        }).then(res => res.json())

        console.log(response)

        setChirpsPageNum(chirpsPageNum + 1)
        setDoneFetching(true);

        const info: UserPayload = response.data.user;
        setChirpsHasNextPage(info.posts.hasNext)
        
        setChirps(chirps.concat(info.posts.posts.map((post: PostPayload) => {
            let rechirper: Rechirper | undefined = undefined
            let p = post;
            
            if (post.id === pinnedPostId)
                return null;
            else if (post.isRechirp) {
                if (post.rootPost == null) {
                    return null
                } else {
                    rechirper = {
                        username: post.author.username,
                        displayName: post.author.displayName,
                        userColor: post.author.userColor,
                        dateRechirped: post.postDate
                    }

                    p = post.rootPost;
                }
            }

            return <Chirp
                authorUsername={p.author.username}
                authorDisplayName={p.author.displayName}
                authorPictureURL={p.author.pictureURL}
                id={p.id}
                postDate={p.postDate}
                text={p.text}
                imageURL={p.imageURL}
                key={p.id}
                score={p.score}
                voteStatus={userInfo.state.username ? p.voteStatus : 0}
                rechirpStatus={userInfo.state.username ? p.rechirpStatus : false}
                userColor={p.author.userColor}
                isEdited={p.isEdited}
                pinned={false}

                rechirper={rechirper}
            />
        })))
    }

    //gets followers or following
    const getFollowerIng = async () => {
        let type = "";
        let pageNum = 0

        switch (viewSelected) {
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
                            pictureURL
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

        const info: {hasNext: boolean, users: UserPayload[]} = response.data.user[type];
        const fetchedUsers = info.users.map((user: UserPayload) => {
            return <UserSearchResult
                username={user.username}
                displayName={user.displayName}
                userColor={user.userColor}
                pictureURL={user.pictureURL}
                postCount={user.postCount}
                followerCount={user.followerCount}
                followingCount={user.followingCount}
                key={type + user.username} />
        })

        if (type === "followers") {
            setFollowersHasNextPage(info.hasNext)
            setFollowersPageNum(followersPageNum + 1)
            setFollowers(followers.concat(fetchedUsers))
        } else if (type === "following") {
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
            body: JSON.stringify({ query })
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
            body: JSON.stringify({ query })
        }).then(res => res.json())
        console.log(response)

        window.location.reload()
    }


    const [sortMethod, sortDirection, sortBubble] = useSort(doneFetching, getChirps, () => {
        setChirps([])
        setChirpsPageNum(0)
        setChirpsHasNextPage(true);
        setDoneFetching(false)
    })

    useScrollBottom(async () => {
        setDoneFetching(false)

        switch (viewSelected) {
            case View.Followers:
            case View.Following:
                await getFollowerIng();
                break;

            case View.Chirps:
            default:
                await getChirps()
                break;
        }
    })


    let feed: JSX.Element[] | JSX.Element | null = null;
    switch (viewSelected) {
        case View.Chirps:
            if (chirpsPageNum > 0 && chirps.length === 0)
                feed = <div className="text-center text-white text-lg">{`${username} has not made any chirps`}</div>
            else
                feed = <>{pinnedPost}{chirps}</>

            break;

        case View.Followers:
            if (followersPageNum > 0 && followers.length === 0)
                feed = <div className="text-center text-white text-lg">{`${username} has no followers. Why not be the first one?`}</div>
            else
                feed = followers
            
            break;

        case View.Following:
            if (followingPageNum > 0 && following.length === 0)
                feed = <div className="text-center text-white text-lg">{`${username} is not following any users`}</div>
            else
                feed = following

            break;

        default:
            break;
    }


    let placeholder;
    if (viewSelected === View.Chirps) {
        placeholder = (
            <>
                <ChirpPlaceholder />
                <ChirpPlaceholder />
                <ChirpPlaceholder />
                <ChirpPlaceholder />
                <ChirpPlaceholder />
            </>
        )
    } else {
        placeholder = (
            <>
                <div className = "p-4 bg-black/10 rounded my-3"> <SpinningCircle /> </div>
                <div className = "p-4 bg-black/10 rounded my-3"> <SpinningCircle /> </div>
                <div className = "p-4 bg-black/10 rounded my-3"> <SpinningCircle /> </div>
            </>
        );
    
    }

    if (!doneFetching && username === null) { //first load
        return (<Layout>
           <ProfilePlaceholder />
        </Layout>)

    } else if (doneFetching && username === null) { //first load done, but user not found
        return (<Layout>
            <div className="text-center bg-red-200 py-8 shadow-md">
                <h1>{`User ${params.username} not Found`}</h1>
            </div>
        </Layout>)
    }


    return (<Layout>
        <div className="text-center p-4 shadow-md relative" style={{ backgroundColor: userColor }} 
            onMouseEnter = {() => {setShowSetting(true)}}
            onMouseLeave = {() => {setShowSetting(false)}}>

            {viewSelected === View.Chirps && !editingColor ? sortBubble : null}

            {showSetting && userInfo.state.username === username ? 
                <a href="/settings" className="absolute right-1 top-1">
                    <svg xmlns="http://www.w3.org/2000/svg"  width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"></path>
                        <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path>
                    </svg>
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
                    <div className={`w-fit mx-auto cursor-pointer select-none ${viewSelected === View.Chirps ? "text-[#b22222]" : "text-black"}`} onClick={() => setViewSelected(View.Chirps)}>
                        {`${postCount} chirp${postCount !== 1 ? "s" : ""}`}
                    </div>

                    <div className={`w-fit mx-auto cursor-pointer select-none ${viewSelected === View.Followers ? "text-[#b22222]" : "text-black"}`} onClick={() => setViewSelected(View.Followers)}>
                        {`${followerCount} follower${followerCount !== 1 ? "s" : ""}`}
                    </div>

                    <div className={`w-fit mx-auto cursor-pointer select-none ${viewSelected === View.Following ? "text-[#b22222]" : "text-black"}`} onClick={() => setViewSelected(View.Following)}>
                        {`${followingCount} following`}
                    </div>
                </div>

            </div>

            {userInfo.state.username !== username ?
                <button onClick={toggleFollow} className={`inline text-black px-4 py-2 mt-2 w-fit h-fit my-auto text-sm rounded-lg ${isFollowing ? "bg-rose-200/75" : "bg-green-100/75"}`}>
                    {isFollowing ? "Unfollow" : "Follow"}
                </button>
                : null}
        </div>

        {userInfo.state.username === username && viewSelected === View.Chirps ?
            <div className="w-full bg-black/30 shadow-md pt-8 pb-1">
                <div className="mx-auto w-11/12 md:w-3/4 lg:w-3/5">
                    <PostComposer />
                </div>
            </div>
            : <div />}

        <div className="mt-4 mx-auto w-11/12 md:w-3/4 lg:w-3/5">
            <ul className="mt-4">
                {feed}

                {!doneFetching ? placeholder : null}
            </ul>
        </div>


        {editingColor ?
            <div className="fixed bottom-2 right-2 w-fit text-center border border-black/30 bg-black/60 shadow-md rounded-xl p-4">
                <p className="text-white">Click below to select a new color</p>
                <input type="color" className="bg-transparent block mx-auto w-16 h-16" value={userColor} onChange={(e) => setUserColor(e.target.value)} />
                <button onClick={() => { navigate("/settings") }} className="text-sm text-white px-4 py-2 mx-auto my-2 mr-2 bg-rose-700/30 rounded-xl border border-black/50">
                    Cancel
                </button>
                <button onClick={updateUserColor} className="text-sm text-white px-4 py-2 mx-auto my-2 bg-white/10 rounded-xl border border-black/50">
                    Save Changes
                </button>

            </div> : null}

    </Layout>)

}

export default Profile