import { editableInputTypes } from "@testing-library/user-event/dist/utils";
import { useState, useContext, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PostPayload, UserContext, UserPayload } from "../App";
import Chirp from "../home/Chirp";
import PostComposer from "../home/PostComposer";
import useScrollBottom from "../hooks/useScrollBottom";
import Layout from "../Layout";
import SpinningCircle from "../SpinningCircle";


function Profile () {
    const userInfo = useContext(UserContext);
    const params = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [loading, setLoading] = useState(true);

    const [username, setUsername] = useState<string | null>("");
    const [displayName, setDisplayName] = useState<string>("");
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState<number>(0);
    const [followingCount, setFollowingCount] = useState<number>(0);
    const [chirps, setChirps] = useState<JSX.Element[]>([]);
    const [pageNum, setPageNum] = useState(0);
    const [postCount, setPostCount] = useState(0);
    
    const [userColor, setUserColor] = useState<string>("#9590b7")
    const [editingColor, setEditingColor] = useState(false);

    const navigate = useNavigate();

    useEffect( () => {
        if (params && params.username) {
            fetchUserInfo(params.username);
        }
        
        if (searchParams && searchParams.get("editColor")) {
            setEditingColor(true);
            setSearchParams("")
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] )


    useEffect(() => {
        if (username && postCount > 0 && !editingColor) {
            getMoreChirps(); // separate getting chirps to speed up initial load
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username, editingColor])



    const fetchUserInfo = async (username: string) => {
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL

        const query =
        `query {    
            user(username: "${username}") {
                username
                displayName
                followerCount
                followingCount
                postCount
                userColor
                ${userInfo.state.username ? `isFollowing(followeeUsername: "${userInfo.state.username}")` : ""}
            }
        }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({query})
        }).then(res => res.json())

        setLoading(false)
        console.log(response)
        const info: UserPayload = response.data.user
        if (info === null) {
            setUsername(null);
            return
        }

        setUsername(info.username)
        setDisplayName(info.displayName)
        setFollowerCount(info.followerCount)
        setFollowingCount(info.followingCount)
        setPostCount(info.postCount)
        setUserColor(info.userColor)

        
        if (userInfo.state.username)
            setIsFollowing(info.isFollowing)
    }

    const getMoreChirps = async () => {
        if (chirps.length === postCount)
            return;

        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `query {    
            user(username: "${username}"${userInfo.state.username ? `, relatedUsername: "${userInfo.state.username}"` : ""}) {
                postCount
                userColor
                posts(first: ${pageNum}, offset: 5) {
                    id
                    text
                    postDate(timezone: ${timezone})
                    score
                    ${userInfo.state.username ? "voteStatus" : ""}
                }
            }
        }`

        
        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({query})
        }).then(res => res.json())
        
        console.log(response)

        
        setPageNum(pageNum + 1)

        const info: UserPayload = response.data.user;
        setPostCount(info.postCount)
        
        setChirps(chirps.concat(info.posts.map((post: PostPayload) => {
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
                />
        })))
    }

    useScrollBottom(getMoreChirps);

    const textColor = (): "black" | "white" => {
        const r = parseInt(userColor.substring(1,3), 16);
        const g = parseInt(userColor.substring(3,5), 16);
        const b = parseInt(userColor.substring(5,7), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        return brightness > 125 ? "black" : "white";
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

    if (loading)
        return <Layout><SpinningCircle /></Layout>
    else if (username === null) {
        return (<Layout>
            <div className = "text-center bg-red-200 py-8 shadow-md">
                <h1>{`User ${params.username} not Found`}</h1>
            </div>
        </Layout>)
    }

    return (<Layout>
        <div className = "text-center p-2 shadow-md" style = {{
            backgroundColor: userColor,
            color: textColor()
        }}>
            <h1 className = "text-3xl break-words">{displayName}</h1>
            <h1 className = "text-sm">{`@${username}`}</h1>

            <div className = "mx-auto flex justify-center mt-3 w-fit">

                <div className = "text-sm w-fit my-auto border border-white/10 text-black bg-slate-200/50 px-4 py-1 rounded-xl">
                    <div className="w-fit mx-auto">
                    {`${followerCount} follower${followerCount !== 1 ? "s" : ""}` }
                    </div>

                    <div className="w-fit mx-auto">
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

        {editingColor ? 
        <>
            <ul className = "mt-4 mx-auto w-11/12 md:w-3/4 lg:w-3/5">
                <Chirp
                    authorUsername={username}
                    authorDisplayName={displayName}
                    id = {"EXAMPLE_CHIRP"}
                    postDate = {new Date().toLocaleTimeString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', })}
                    text = {"This is a test chirp!"}
                    key = {"EXAMPLE_CHIRP"}
                    score = {0}
                    voteStatus = {0}
                    userColor = {userColor}

                />
            </ul>

            <div className = "mx-auto w-fit mt-3 text-center border border-black/30 bg-slate-800/10 shadow-md rounded-xl px-12 py-6">
                    <p className = "text-white w-full" >Click below to select a new color</p>
                    <input type = "color" className = "bg-transparent w-full h-16" value = {userColor} onChange = {(e) => setUserColor(e.target.value)} />
                    <button onClick = {() => {navigate("/settings")}} className = "text-sm text-white px-4 py-2 mx-auto my-2 mr-2 bg-rose-700/30 rounded-xl border border-black/50">
                        Cancel
                    </button>
                    <button onClick = {updateUserColor} className = "text-sm text-white px-4 py-2 mx-auto my-2 bg-black/10 rounded-xl border border-black/50">
                        Save Changes
                    </button>

                    <p className = "text-white">This color will be used on your profile header, as well as your display name in chirps.</p>
            </div>
        
            
        </>
        :
        <>
            {userInfo.state.username ?
                <div className = "w-full bg-black/20 shadow-md pt-8 pb-1">
                    <div className = "mx-auto w-11/12 md:w-3/4 lg:w-3/5">
                        <PostComposer />
                    </div>
                </div> 
            : <div />}
            
            <div className = "mt-4 mx-auto w-11/12 md:w-3/4 lg:w-3/5">
                <p className = "text-center text-white text-xl">{`${postCount} chirps`}</p>
                    <ul className = "mt-4">
                        {chirps}

                        {postCount > 0 && chirps.length === 0 ?
                        <SpinningCircle /> 
                        : null}
                    </ul>
            </div>
        </>}

    </Layout>)

}

export default Profile