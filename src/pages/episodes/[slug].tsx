import convertDurationToString from '../../utils/convertDurationToTimeString'
import Image from 'next/image';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { GetStaticProps, GetStaticPaths } from 'next';
import ptBr from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import { api } from '../../services/api';
import styles from './episode.module.scss'
import { useContext } from 'react';
import { usePlayer } from '../../contexts/PlayerContext';

type Episode = {
  id: string;
  title: string;
  members: string;
  thumbnail: string;
  duration: number;
  durationAsString: string;
  url: string;
  publishedAt: string;
  description: string;
}

type EpisodeProps = {
  episode: Episode;
}

export default function Episode({ episode }: EpisodeProps) {
  const router = useRouter();
  const { play } = usePlayer();

  if (router.isFallback) {
    return <p>Carregando...</p>
  }

  return (
    <div className={styles.episode}>
      <div className={styles.thumbnailContainer}>
        <Link href="/">
          <button type="button">
            <img src="/arrow-left.svg" alt="Voltar" />
          </button>
        </Link>
        <Image
          width={700} height={160}
          src={episode.thumbnail}
          objectFit="cover"
        />
        <button type="button" onClick={() => play(episode)}>
          <img src="/play.svg" alt="Tocar Episódio" />
        </button>
      </div>

      <header>
        <h1>{episode.title}</h1>
        <span>{episode.members}</span>
        <span>{episode.publishedAt}</span>
        <span>{episode.durationAsString}</span>
      </header>

      <div
        className={styles.description}
        dangerouslySetInnerHTML={{ __html: episode.description }}
      />

    </div>
  )
}
// Sempre que for usar uma pagina estatica que use [], 
// vai precisar do método a baixo:
export const getStaticPaths: GetStaticPaths = async () => {
  const { data } = await api.get('episodes', {
    params: {
      _limit: 2,
      _sort: 'published_at',
      _order: 'desc'
    }
  })

  const paths = data.map(episode => {
    return {
      params: {
        slug: episode.id
      }
    }
  })

  return {
    paths,    //Path deve ser passado em caso de fallback false
    fallback: 'blocking' //blocking é usado para que as paginas sejam criadas e indexadas no next.js, aliviando o client e ajudando na performance
  }                      //True sempre carrega no lado do client
  //false nao faz pre-carregamento e exige um path passado anteriormente.

}
export const getStaticProps: GetStaticProps = async (ctx) => {
  const { slug } = ctx.params;

  const { data } = await api.get(`/episodes/${slug}`)

  const episode = {
    id: data.id,
    title: data.title,
    thumbnail: data.thumbnail,
    members: data.members,
    publishedAt: format(parseISO(data.published_at), 'd MMM yy', { locale: ptBr }),
    duration: Number(data.file.duration),
    durationAsString: convertDurationToString(Number(data.file.duration)),
    description: data.description,
    url: data.file.url
  }

  return {
    props: {
      episode,
    },
    revalidate: 60 * 60 * 24, // 24 horas
  }
}
