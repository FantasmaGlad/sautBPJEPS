-- Migration : Fonction RPC pour réordonner les sponsors en un seul appel DB
-- À exécuter dans le SQL Editor de Supabase Dashboard :
-- https://supabase.com/dashboard/project/bnmvvagnpicffaythepo/sql/new
--
-- Cette fonction évite N updates individuels + N événements Realtime
-- lors du drag & drop admin (réordonnement des sponsors).

CREATE OR REPLACE FUNCTION reorder_sponsors(sponsor_ids UUID[], new_orders INT[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF array_length(sponsor_ids, 1) != array_length(new_orders, 1) THEN
    RAISE EXCEPTION 'Les tableaux sponsor_ids et new_orders doivent avoir la même taille';
  END IF;

  FOR i IN 1..array_length(sponsor_ids, 1) LOOP
    UPDATE sponsors SET display_order = new_orders[i] WHERE id = sponsor_ids[i];
  END LOOP;
END;
$$;
