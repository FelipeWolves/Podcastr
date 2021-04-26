//import { useEffect } from "react"
import { GetStaticProps } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import convertDurationToString from '../utils/convertDurationToTimeString'
import { format, parseISO } from 'date-fns';
import ptBr from 'date-fns/locale/pt-BR'
import { api } from '../services/api';
import { PlayerContext, usePlayer } from '../contexts/PlayerContext';
import styles from './home.module.scss';

type Episodes = {
  id: string;
  title: string;
  members: string;
  thumbnail: string;
  duration: number;
  durationAsString: string;
  url: string;
  publishedAt: string;
}


type HomeProps = {
  latestEpisodes: Episodes[];
  allEpisodes: Episodes[];
}

export default function Home({ latestEpisodes, allEpisodes }: HomeProps) {
  const { playList } = usePlayer()

  const episodeList = [...latestEpisodes, ...allEpisodes]


  return (
    <div className={styles.homePage}>
      <section className={styles.latestEpisodes}>
        <h2>Últimos Lançamentos </h2>

        <ul>
          {latestEpisodes.map((episode, index) => {
            return (
              <li key={episode.id}>
                <Image
                  width={192}
                  height={192}
                  src={episode.thumbnail}
                  alt={episode.title}
                  objectFit="cover"
                />

                <div className={styles.episodesDetails}>
                  <Link href={`/episodes/${episode.id}`}>
                    <a>{episode.title}</a>
                  </Link>
                  <p>{episode.members}</p>
                  <span>{episode.publishedAt}</span>
                  <span>{episode.durationAsString}</span>
                </div>
                <button type="button" onClick={() => playList(episodeList, index)}>
                  <img src="/play-green.svg" alt="Tocar Episódio" />
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className={styles.allEpisodes}>
        <h2>Todos episódios</h2>

        <table cellSpacing={0}>
          <thead>
            <tr>
              <th></th> {/* imagem de exibição */}
              <th>Podcast</th>
              <th>Integrantes</th>
              <th>Data</th>
              <th>Duração</th>
              <th></th> {/* botao de play */}
            </tr>
          </thead>
          <tbody>
            {allEpisodes.map((episodes, index) => {
              return (
                <tr key={episodes.id}>
                  <td style={{ width: 72 }}>
                    <Image
                      width={120}
                      height={120}
                      src={episodes.thumbnail}
                      alt={episodes.title}
                      objectFit="cover"
                    />
                  </td>
                  <td>
                    <Link href={`/episodes/${episodes.id}`}>
                      <a>{episodes.title}</a>
                    </Link>
                  </td>
                  <td>{episodes.members}</td>
                  <td style={{ width: 100 }}>{episodes.publishedAt}</td>
                  <td>{episodes.durationAsString}</td>
                  <td>
                    <button type="button" onClick={() => playList(episodeList, index + latestEpisodes.length)}>
                      <img src="/play-green.svg" alt="Tocar Episódio" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}

//Nextjs for SSG
export const getStaticProps: GetStaticProps = async () => {
  const { data } = await api.get('episodes', {
    params: {
      _limit: 12,
      _sort: 'published_at',
      _order: 'desc'
    }
  })

  const episodes = data.map(episode => {
    return {
      id: episode.id,
      title: episode.title,
      thumbnail: episode.thumbnail,
      members: episode.members,
      publishedAt: format(parseISO(episode.published_at), 'd MMM yy', { locale: ptBr }),
      duration: Number(episode.file.duration),
      durationAsString: convertDurationToString(Number(episode.file.duration)),
      url: episode.file.url
    }
  })

  const latestEpisodes = episodes.slice(0, 2);
  const allEpisodes = episodes.slice(2, episodes.length);

  return {
    props: {
      latestEpisodes,
      allEpisodes,
    },
    revalidate: 60 * 60 * 8,
  }
}