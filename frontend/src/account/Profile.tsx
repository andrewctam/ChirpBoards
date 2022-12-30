import React, { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { PostChirp, UserContext } from "../App";
import Chirp from "../home/Chirp";
import PostComposer from "../home/PostComposer";
import Layout from "../Layout";
import SpinningCircle from "../SpinningCircle";


function Profile () {
    const userInfo = useContext(UserContext);
    const params = useParams();
    const [loading, setLoading] = useState(true);

    const [username, setUsername] = useState<string | null>("");
    const [displayName, setDisplayName] = useState<string>("");
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState<number>(0);
    const [followingCount, setFollowingCount] = useState<number>(0);
    const [chirps, setChirps] = useState<JSX.Element[]>([]);
    const [pageNum, setPageNum] = useState(0);
    const [postCount, setPostCount] = useState(0);



    useEffect( () => {
        if (params && params.username) {
            fetchUserInfo(params.username);
        }

    }, [] )

    useEffect(() => {
        if (username && postCount > 0) {
            getMoreChirps(); // separate getting chirps to speed up initial load
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username])


    const handleScroll = (e: React.UIEvent<HTMLElement>) => {
        if ((e.target as HTMLElement).scrollHeight - (e.target as HTMLElement).scrollTop === (e.target as HTMLElement).clientHeight) {
            alert()
            getMoreChirps();
        }
    }

    const fetchUserInfo = async (username: string) => {
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()

        const query =
        `query {    
            user(username: "${username}") {
                username
                displayName
                followerCount
                followingCount
                postCount
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
        const info = response.data.user
        if (info === null) {
            setUsername(null);
            return
        }

        setUsername(info.username)
        setDisplayName(info.displayName)
        setFollowerCount(info.followerCount)
        setFollowingCount(info.followingCount)
        setPostCount(info.postCount)

        
        if (userInfo.state.username)
            setIsFollowing(info.isFollowing)

        
    }

    const getMoreChirps = async () => {
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `query {    
            user(username: "${username}") {
                postCount
                posts(first: ${pageNum}, offset: 5) {
                    id
                    text
                    postDate(timezone: ${timezone})
                    score
                    ${userInfo.state.username ? `voteStatus(username: "${userInfo.state.username}")` : ""}
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

        const info = response.data.user;
        setPostCount(info.postCount)
        
        setChirps(chirps.concat(info.posts.map((post: any) => {
            return <Chirp
                    authorUsername={username ?? ""}
                    authorDisplayName={displayName}
                    id = {post.id}
                    postDate = {post.postDate}
                    text = {post.text}
                    key = {post.id}
                    score = {post.score}
                    voteStatus = {userInfo.state.username ? post.voteStatus : null}
                />
        })))
    }

    const toggleFollow = async () => {
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
        <div onScroll = {handleScroll} className = "text-center bg-slate-600 text-white p-2 shadow-md">
            <h1 className = "text-3xl">{displayName}</h1>
            <h1 className = "text-gray-300 text-sm">{`@${username}`}</h1>


            <div className = "mx-auto flex justify-center mt-3 w-fit">

                <div className = "text-sm w-fit my-auto border border-white/10 bg-slate-200/25 px-4 py-1 rounded-xl">
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

        <div className = "mt-8 mx-auto w-11/12 md:w-3/4 lg:w-3/5">
            {userInfo.state.username === username ? 
                <PostComposer /> 
            : null}

            <ul className = "mt-24 mb-8">
                {chirps}

                {postCount > 0 && chirps.length === 0 ?
                    <SpinningCircle /> 
                : null}

                {chirps.length < postCount && chirps.length !== 0 ?
                    <p onClick = {getMoreChirps} className = "cursor-pointer text-sky-100">{`Load more chirps`}</p>
                : null 
                }
            </ul>
        </div>

    </Layout>)

}

export default Profile