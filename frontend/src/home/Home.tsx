import React, {useContext, useEffect, useRef, useState} from "react";
import Layout from "../Layout";
import FeedButton from "./FeedButton";
import Chirp from "./Chirp";
import { PostChirp, UserContext } from "../App";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import SpinningCircle from "../SpinningCircle";

export enum Feed {None, Following, Recent, Popular}

function Home() {
    const [composedChirp, setComposedChirp] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const [feedSelected, setFeedSelected] = useState<Feed>(Feed.None)
    const [recentFeed, setRecentFeed] = useState<JSX.Element[]>([]);
    const [popularFeed, setPopularFeed] = useState<JSX.Element[]>([]);

    const userInfo = useContext(UserContext);
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();

    const updateComposedChirp = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = (e.target as HTMLTextAreaElement).value

        if (text.length > 500)  {
            setComposedChirp(text.substring(0, 500))
            setErrorMsg("Character limit reached!")
            return
        }
        setErrorMsg("")
        setComposedChirp(text)
    }

    const createChirp = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()

        if (!userInfo.state.username) {
            navigate("/signin?return=true")
            return;
        }

        if (!composedChirp) {
            setErrorMsg("Text can not be blank!")
            return
        }

        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query = 
        `mutation {
            createPost(text: "${composedChirp}", username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}") {
                post {
                    id
                }
            }
        }`

        console.log(JSON.stringify({query}))

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({query})
        }).then(res => res.json())

        console.log(response)

        if (!response.data.createPost) {
            alert("Error!")
            return
        }

        navigate(`/board/${response.data.createPost.post.id}`)
    }
    
    const getRecentPopularChirps = async (type: "recent" | "popular") => {
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const query = 
        `query {
            ${type}Posts {
                id
                text
                author {
                    username
                    displayName
                }
                postDate(timezone: ${timezone})
                score
                ${userInfo.state.username ? `voteStatus(username: "${userInfo.state.username}")` : ""}
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

        if (type === "popular") {
            setPopularFeed(response.data.popularPosts.map((post: any) => {
                return <Chirp
                        authorUsername={post.author.username}
                        authorDisplayName={post.author.displayName}
                        id = {post.id}
                        postDate = {post.postDate}
                        text = {post.text}
                        key = {post.id}
                        score = {post.score}
                        voteStatus = {userInfo.state.username ? post.voteStatus : null}
                    />
            }))
        } else {
            setRecentFeed(response.data.recentPosts.map((post: any) => {
                return <Chirp
                        authorUsername={post.author.username}
                        authorDisplayName={post.author.displayName}
                        id = {post.id}
                        postDate = {post.postDate}
                        text = {post.text}
                        key = {post.id}
                        score = {post.score}
                        voteStatus = {userInfo.state.username ? post.voteStatus : null}
                    />
            }))
        }

    }



    useEffect(() => {
        switch(feedSelected) {
            case Feed.Recent:
                getRecentPopularChirps("recent");
                setSearchParams({feed: "recent"})
                return;
            case Feed.Popular:
                getRecentPopularChirps("popular");
                setSearchParams({feed: "popular"})
                return;
            case Feed.Following:
                if (!userInfo.state.username) {
                    navigate("/signin?return=true")
                } else
                    setSearchParams({feed: "following"})
                return;
            
            default: 
            return;
        }
    }, [feedSelected])

    useEffect(() => {
        //on load
        switch(searchParams.get("feed")) {
            case "recent":
                setFeedSelected(Feed.Recent)
                return;
            case "popular":
                setFeedSelected(Feed.Popular)
                return;
            case "following":
                setFeedSelected(Feed.Following)
                return;
            default:
                setFeedSelected(Feed.Recent);
        }
    
    }, []) 


    let feed = null;

    switch(feedSelected) {
        case Feed.Recent:
            feed = recentFeed;
            break;
        case Feed.Popular:
            feed = popularFeed;
            break;
        case Feed.Following:
            feed =  null
            break;
        default:
            break;
    }

    return ( <Layout>
            <div className = "mt-8 mx-auto w-11/12 md:w-3/4 lg:w-3/5">
                {userInfo.state.username ?
                <form onSubmit = {createChirp} className = "w-full py-2 mb-12 bg-gray-100/20 border border-black/10 shadow-lg relative rounded">
                    <textarea 
                        value = {composedChirp} 
                        onChange = {updateComposedChirp} 
                        className = "bg-sky-200 border border-black/10 shadow rounded-xl resize-none px-6 pt-2 mt-2 ml-[-2%] w-[104%] h-24 focus:outline-none placeholder:text-black/75"
                        placeholder= "Compose a chirp..."/>

                    <p className = "text-white mb-4 ml-4">
                        {errorMsg ? errorMsg 
                        : `${composedChirp.length}/500 characters`}
                    </p>
                    
                    <button className = "bg-sky-200 text-black border border-black/10 rounded shadow-md absolute -bottom-3 right-4 px-4 py-2" 
                        onClick = {createChirp}>
                        Post
                    </button>
                </form>
                : null}


                <div className = "grid rows-2">
                    <div className = "grid grid-cols-3">
                            <FeedButton 
                                type = {Feed.Recent}
                                name = {"Recent"}
                                setFeed = {setFeedSelected}
                                isActive = {feedSelected === Feed.Recent} />
                            <FeedButton 
                                type = {Feed.Popular}
                                name = {"Popular"}
                                setFeed = {setFeedSelected}
                                isActive = {feedSelected === Feed.Popular} />
                            <FeedButton 
                                type = {Feed.Following}
                                name = {"Following"}
                                setFeed = {setFeedSelected}
                                isActive = {feedSelected === Feed.Following} />
                    </div>
                    
                    <ul>
                        {feed}
                        
                        {feed && feed.length > 0 ? 
                        <li className = "text-center text-white my-5">
                            End of Feed
                        </li>
                        : 
                        <SpinningCircle/>}
                    </ul>
                    
                </div>
            </div>
    </Layout>)
}



export default Home;
