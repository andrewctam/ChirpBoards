import { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { PostChirp, UserContext } from "../App";
import Chirp from "../home/Chirp";
import Layout from "../Layout";
import SpinningCircle from "../SpinningCircle";


function Profile () {
    const userInfo = useContext(UserContext);
    const params = useParams();
    const [loading, setLoading] = useState(true);

    const [username, setUsername] = useState<string | null>("");
    const [displayName, setDisplayName] = useState<string>("");
    const [followerCount, setFollowerCount] = useState<number>(0);
    const [followingCount, setFollowingCount] = useState<number>(0);
    const [posts, setPosts] = useState<JSX.Element[]>([]);
    
    useEffect( () => {
        if (params && params.username) {
            fetchUserInfo(params.username);
        }
    }, [] )


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
                posts(first: 0, offset: 5) {
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

        setPosts(info.posts.map((post: any) => {
            return <Chirp
                    authorUsername={info.username}
                    authorDisplayName={info.displayName}
                    id = {post.id}
                    postDate = {post.postDate}
                    text = {post.text}
                    key = {post.id}
                    score = {post.score}
                    voteStatus = {userInfo.state.username ? post.voteStatus : null}
                />
        }))
        
    }


    return (<Layout>
        {loading ? <SpinningCircle /> 
        :
            !username ? <h1>User Not found </h1> :
            <>
                <div className = "text-center bg-sky-200 p-2 shadow-md">
                    <h1 className = "text-3xl">{displayName}</h1>
                    <h1 className = "text-gray-600 text">{`@${username}`}</h1>

                        <div className = "text-sm mt-3">
                            <div className="inline">
                            {`${followerCount} follower${followerCount !== 1 ? "s" : ""}` }
                            </div>
                            <div className="ml-5 inline">
                                {`${followingCount} following` }
                            </div>
                        </div>
                </div>

                <div className = "mt-8 mx-auto w-11/12 md:w-3/4 lg:w-3/5">
                    <ul>{posts}</ul>
                </div>


            </>
        }

    </Layout>)

}

export default Profile