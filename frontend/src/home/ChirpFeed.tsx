import { useContext, useEffect, useState } from "react";
import FeedButton from "./FeedButton";
import Chirp, { Rechirper } from "./Chirp";
import { UserContext } from "../App";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PostPayload } from "../App";
import useScrollBottom from "../hooks/useScrollBottom";
import useSort from "../hooks/useSort";
import ChirpPlaceholder from "../placeholders/ChirpPlaceholder";

export enum Feed { None, Trending, All, Following }

const ChirpFeed = () => {
    const [feedSelected, setFeedSelected] = useState<Feed>(Feed.None)

    const [allFeed, setAllFeed] = useState<JSX.Element[]>([]);
    const [trendingFeed, setTrendingFeed] = useState<JSX.Element[]>([]);
    const [followingFeed, setFollowingFeed] = useState<JSX.Element[]>([]);

    const [allPageNum, setAllPageNum] = useState(0);
    const [trendingPageNum, setTrendingPageNum] = useState(0);
    const [followingPageNum, setFollowingPageNum] = useState(0);

    const [allHasNextPage, setAllHasNextPage] = useState(true);
    const [trendingHasNextPage, setTrendingHasNextPage] = useState(true);
    const [followingHasNextPage, setFollowingHasNextPage] = useState(true);

    const [doneFetching, setDoneFetching] = useState(false);
    const [followingOthers, setFollowingOthers] = useState(false);
    const userInfo = useContext(UserContext);
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();

    const switchFeeds = (feed: Feed) => {
        setFeedSelected(feed);
        setDoneFetching(false)
        setSearchParams({ feed: feed === Feed.All ? "all" : feed === Feed.Trending ? "trending" : "following" })
    }

    useEffect(() => {
        //get initial chirps when the selected feed changes

        //inital page load, set the feed in the hook below
        if (feedSelected === Feed.None) 
            return;

        if ((feedSelected === Feed.All && allFeed.length === 0)  ||
            (feedSelected === Feed.Trending && trendingFeed.length === 0)  ||
            (feedSelected === Feed.Following && followingFeed !== null && followingFeed.length === 0)) {
                getChirps();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feedSelected])

    useEffect(() => {
        //initial page load
        switch (searchParams.get("feed")) {
            case "all":
                setFeedSelected(Feed.All)
                return;
            case "trending":
                setFeedSelected(Feed.Trending)
                return;
            case "following":
                setFeedSelected(Feed.Following)
                return;
            default:
                setFeedSelected(Feed.All);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps 
    }, [])


    const getChirps = async () => {
        let type = "";
        let pageNum = 0
        setDoneFetching(false);
        if (feedSelected === Feed.Following) {
            if (userInfo.state.username === "") {
                navigate(`/signin?return=${window.location.pathname}`)
                return;
            }
            if (!followingHasNextPage) {
                setDoneFetching(true);
                return;
            }

            type = "following";
            pageNum = followingPageNum;
        } else if (feedSelected === Feed.Trending) {
            if (!trendingHasNextPage) {
                setDoneFetching(true);
                return;
            }

            type = "trending";
            pageNum = trendingPageNum;
        } else if (feedSelected === Feed.All) {
            if (!allHasNextPage) {
                setDoneFetching(true);
                return;
            }

            type = "all";
            pageNum = allPageNum;
        } else {
            return;
        }

        let usernameField = "";
        if (feedSelected === Feed.Following) {
            usernameField = `, username: "${userInfo.state.username}"`
        } else if (userInfo.state.username)
            usernameField = `, relatedUsername: "${userInfo.state.username}"`

        let sortField = "";
        if (feedSelected === Feed.All || feedSelected === Feed.Following)
            sortField = `, sortMethod: "${sortMethod}", sortDirection: "${sortDirection}"`;


        const url = import.meta.env.DEV ? import.meta.env.VITE_DEV_URL : import.meta.env.VITE_PROD_URL
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const query =
            `query {
                ${type}Posts(pageNum: ${pageNum}, size: 10${usernameField}${sortField}) {
                    hasNext
                    posts {
                        id
                        text
                        imageURL
                        isEdited
                        author {
                            username
                            displayName
                            userColor
                            pictureURL
                        }
                        postDate(timezone: ${timezone})
                        score
                        ${userInfo.state.username ? "voteStatus" : ""}
                        ${userInfo.state.username ? "rechirpStatus" : ""}

                        ${feedSelected !== Feed.Following ? "" :
                        `isRechirp
                        rootPost {
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
                        }`
                        }
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
        console.log(response)


        const info: {hasNext: boolean, posts: PostPayload[]} = response.data[`${type}Posts`];
        setDoneFetching(true);

        if (feedSelected === Feed.Following) {
            if (!info)
                setFollowingFeed([]);
            else
                setFollowingOthers(true);
        }

        if (!info) {
           return;
        }


        const newChirps: JSX.Element[] = info.posts.map((post: PostPayload) => {
            let rechirper: Rechirper | undefined = undefined

            if (feedSelected === Feed.Following && post.isRechirp) {
                if (post.rootPost == null) { //original post was deleted
                    return null;
                } else {
                    rechirper = {
                        username: post.author.username,
                        displayName: post.author.displayName,
                        userColor: post.author.userColor,
                        dateRechirped: post.postDate
                    }

                    post = post.rootPost;
                }
            }

            return <Chirp
                authorUsername={post.author.username}
                authorDisplayName={post.author.displayName}
                authorPictureURL={post.author.pictureURL}
                id={post.id}
                postDate={post.postDate}
                text={post.text}
                imageURL={post.imageURL}
                key={post.id}
                score={post.score}
                voteStatus={userInfo.state.username ? post.voteStatus : 0}
                rechirpStatus={userInfo.state.username ? post.rechirpStatus : false}
                userColor={post.author.userColor}
                isEdited={post.isEdited}
                pinned={null} //only shows on profile

                rechirper={rechirper}
            />
        })
        .filter((chirp: JSX.Element | null) => chirp !== null) as JSX.Element[];

        if (feedSelected === Feed.All) {
            setAllFeed(allFeed.concat(newChirps));
            setAllPageNum(allPageNum + 1);
            setAllHasNextPage(info.hasNext);
        } else if (feedSelected === Feed.Trending) {
            setTrendingFeed(trendingFeed.concat(newChirps));
            setTrendingPageNum(trendingPageNum + 1);
            setTrendingHasNextPage(info.hasNext);
        } else if (feedSelected === Feed.Following && followingFeed !== null) {
            setFollowingFeed(followingFeed.concat(newChirps));
            setFollowingPageNum(followingPageNum + 1);
            setFollowingHasNextPage(info.hasNext);
        }
    }



    let emptyMsg = "";
    let feed: JSX.Element[] = [];
    switch (feedSelected) {
        case Feed.All:
            feed = allFeed;
            emptyMsg = "No chirps yet...";

            break;
        case Feed.Trending:
            feed = trendingFeed;
            emptyMsg = "No chirps in the past 24 hours";

            break;
        case Feed.Following:
            feed = followingFeed;

            if (followingOthers)
                emptyMsg = "No chirps from followed users";
            else
                emptyMsg = "You are not following any users";

            break;
        default:
            break;
    }


    useScrollBottom(async () => {
        await getChirps()
    })

    
    const [sortMethod, sortDirection, sortBubble] = useSort(doneFetching, getChirps, () => {
        setAllFeed([])
        setFollowingFeed([])

        setAllPageNum(0)
        setFollowingPageNum(0)

        setAllHasNextPage(true)
        setFollowingHasNextPage(true)
    })

    return (
        <div className="p-4 bg-black/20 min-h-screen shadow-2xl">
            {feedSelected !== Feed.Trending ? sortBubble : null}
            
                <div className="grid grid-cols-3 mb-6">
                    <FeedButton
                        name={"Trending (24H)"}
                        onClick={() => switchFeeds(Feed.Trending)}
                        isActive={feedSelected === Feed.Trending} />
                    <FeedButton
                        name={"All"}
                        onClick={() => switchFeeds(Feed.All)}
                        isActive={feedSelected === Feed.All} />
                    <FeedButton
                        name={"Following"}
                        onClick={() => switchFeeds(Feed.Following)}
                        isActive={feedSelected === Feed.Following} />
                </div>

                <ul className="mt-6 w-[95%] mx-auto">
                    {feed}

                    {!doneFetching ?
                        <>
                            <ChirpPlaceholder />
                            <ChirpPlaceholder />
                            <ChirpPlaceholder />
                            <ChirpPlaceholder />
                            <ChirpPlaceholder />
                            <ChirpPlaceholder />
                            <ChirpPlaceholder />
                            <ChirpPlaceholder />   
                        </>
                    : feed.length === 0 ?
                        <div className="text-center text-white text-lg my-4 whitespace-pre-line">
                            {emptyMsg}
                        </div> 
                    : null}
                </ul>
            </div>
    )
}

export default ChirpFeed;