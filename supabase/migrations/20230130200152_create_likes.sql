create table "public"."likes" (
    "hash" text not null,
    "reactorid" bigint,
    "reactorusername" text,
    "reactordisplayname" text,
    "timestamp" timestamp with time zone,
    "casthash" text
);


CREATE UNIQUE INDEX likes_pkey ON public.likes USING btree (hash);

alter table "public"."likes" add constraint "likes_pkey" PRIMARY KEY using index "likes_pkey";


