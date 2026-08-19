-- ROLES ---------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- CATEGORIES ----------------------------------------------------------
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PRODUCTS ------------------------------------------------------------
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  category_slug text NOT NULL DEFAULT 'clothing',
  image text NOT NULL DEFAULT '',
  editorial text NOT NULL DEFAULT '',
  details text[] NOT NULL DEFAULT '{}',
  is_new boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active products are public" ON public.products FOR SELECT USING (active = true);
CREATE POLICY "Admins read all products" ON public.products FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product images are public" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Admins manage product images" ON public.product_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, size)
);
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Variants are public" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admins manage variants" ON public.product_variants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER product_variants_updated_at BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CATALOGUE (personal shopper gallery) ---------------------------------
CREATE TABLE public.catalogue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  tag text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  image text NOT NULL,
  visible boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.catalogue_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalogue_items TO authenticated;
GRANT ALL ON public.catalogue_items TO service_role;
ALTER TABLE public.catalogue_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visible catalogue items are public" ON public.catalogue_items FOR SELECT USING (visible = true);
CREATE POLICY "Admins read all catalogue items" ON public.catalogue_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage catalogue items" ON public.catalogue_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER catalogue_items_updated_at BEFORE UPDATE ON public.catalogue_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ORDERS ---------------------------------------------------------------
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  channel text NOT NULL DEFAULT 'transfer',
  status text NOT NULL DEFAULT 'pending_payment',
  subtotal integer NOT NULL DEFAULT 0,
  shipping integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  has_pre_order boolean NOT NULL DEFAULT false,
  admin_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can place an order" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read orders" ON public.orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_slug text NOT NULL DEFAULT '',
  name text NOT NULL,
  size text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  unit_price integer NOT NULL DEFAULT 0,
  pre_order boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can add order lines" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read order lines" ON public.order_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage order lines" ON public.order_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- SHOPPER REQUESTS -----------------------------------------------------
CREATE TABLE public.shopper_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  budget text NOT NULL DEFAULT '',
  sizes text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.shopper_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopper_requests TO authenticated;
GRANT ALL ON public.shopper_requests TO service_role;
ALTER TABLE public.shopper_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a request" ON public.shopper_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read requests" ON public.shopper_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage requests" ON public.shopper_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER shopper_requests_updated_at BEFORE UPDATE ON public.shopper_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- STORE SETTINGS -------------------------------------------------------
CREATE TABLE public.store_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  whatsapp_number text NOT NULL DEFAULT '2348148840440',
  bank_name text NOT NULL DEFAULT '',
  account_name text NOT NULL DEFAULT '',
  account_number text NOT NULL DEFAULT '',
  shipping_fee integer NOT NULL DEFAULT 5000,
  transfer_instructions text NOT NULL DEFAULT '',
  instagram_handle text NOT NULL DEFAULT 'mayandco.ng',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store settings are public" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage store settings" ON public.store_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER store_settings_updated_at BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SEED -----------------------------------------------------------------
INSERT INTO public.categories (slug, name, position) VALUES
  ('clothing', 'Clothing', 1),
  ('accessories', 'Accessories', 2);

INSERT INTO public.store_settings (id, whatsapp_number, bank_name, account_name, account_number, shipping_fee, transfer_instructions)
VALUES (true, '2348148840440', 'Access Bank', 'MAY & CO.', '0000000000', 5000,
  'Transfer the exact total to the account above, then send your payment receipt on WhatsApp with your order reference. Orders are dispatched only after payment is confirmed.');

INSERT INTO public.products (slug, name, price, category_slug, image, editorial, details, is_new, position) VALUES
('leopard-mesh-set','Leopard Mesh Capri Top & Pant',39000,'clothing','/__l5e/assets-v1/ccccd507-cedd-4e02-990a-e421114cfc3a/leopard-real.jpg','A second-skin mesh two-piece in a smoked leopard print with contrast lace trim. Long-sleeve button-through top with matching capri leggings — engineered for evening, styled for the street.',ARRAY['Sheer stretch mesh','Two-piece set','Lace trim detail','Hand wash cold, line dry'],true,1),
('tie-dye-floral-midi-dress','Tie-Dye Floral Ruched Midi Dress',37500,'clothing','/__l5e/assets-v1/f5bf09b1-5e67-4f61-bb1d-ef06d4107606/img-2318.jpeg','A watercolour floral slip in pastel blue, pink and butter yellow. Ruched bust, sculpted waist panels and a thigh-high back slit — the summer dinner dress.',ARRAY['Ruched stretch jersey','Adjustable spaghetti straps','Back slit','Midi length'],true,2),
('striped-polo-pleated-trouser-set','Striped Polo & Pleated Trouser Set',46000,'clothing','/__l5e/assets-v1/e730b354-a5fa-498c-af57-64fcf357b8dd/img-2317.jpeg','Oversized knit polo in sand, chocolate and burnt orange stripes, paired with high-waist pleated balloon trousers in vivid tangerine. Relaxed volume, resort attitude.',ARRAY['Knit polo with open collar','Pleated balloon trousers','Sold as a two-piece set'],true,3),
('halter-neck-puff-dress','Halter Neck Puff Dress',41500,'clothing','/__l5e/assets-v1/815c94d4-c814-44d9-bcc9-fee5182b408e/halter-puff-dress.jpg','Structured ivory mini with an exaggerated puff sleeve and a plunging halter neckline. Tailored panels hold the silhouette from morning to midnight.',ARRAY['Structured crepe','Concealed back zip','Fully lined'],true,4),
('pleated-polka-dot-dress','Pleated Polka Dot Dress',42000,'clothing','/__l5e/assets-v1/98ae798e-4001-4b55-a764-2e4b04736b81/polka-dot-dress.jpg','Micro-pleated midi in a graphic monochrome dot, cinched with a grosgrain waistband. Movement is the point.',ARRAY['Micro-pleated georgette','Elasticated waistband','Midi length'],true,5),
('patchwork-denim-trousers','Patchwork Denim Trousers',45500,'clothing','/__l5e/assets-v1/025abfb1-b5f2-4bdb-a1c9-215e5b7126ca/patchwork-denim.jpg','Wide-leg denim assembled from four contrast washes. Rigid at the waist, fluid through the leg — a workwear silhouette with couture proportions.',ARRAY['100% rigid cotton denim','Contrast patch panels','Wide-leg fit'],false,6),
('miu-miu-curated-cap','Miu Miu Curated Baker Boy Cap',25000,'accessories','/__l5e/assets-v1/a509606c-3656-4f06-bc1d-7d1936fff773/img-2319.jpeg','A curated designer baker boy cap sourced for the MAY & CO. accessories edit. Panelled crown, leather-trim brim and gold lettering — available in black, cream, chocolate and camel.',ARRAY['Curated sourced piece','Leather-trim brim','Gold-tone lettering','One size'],false,7),
('matte-claw-clip-trio','Matte Claw Clip Trio',9500,'accessories','/__l5e/assets-v1/ea5a1147-1606-4909-99f3-9f9b87b8c5e2/img-2313.jpeg','A set of three oversized matte claw clips in black, espresso and terracotta. Strong-hold hinge, no-slip grip — built for thick hair.',ARRAY['Set of three','Matte finish','Strong-hold hinge'],true,8),
('curated-accessory-gift-box','Curated Accessory Gift Box',18000,'accessories','/__l5e/assets-v1/2cb70f35-a52b-4d07-9417-9ec8ed16e1d5/img-2312.jpeg','A ready-to-gift window box of scrunchies, pearl sets, stud earrings and clips — curated by tone and packed by hand. Tell us the colour story and we build it.',ARRAY['Hand-packed window box','Scrunchies, clips, pearls & studs','Colour story on request'],true,9),
('sculpted-corset-satin-set','Sculpted Corset & Satin Skirt',52000,'clothing','/__l5e/assets-v1/dfb79d4f-f8ff-423b-b812-eac7c820e920/corset-satin-set.jpg','Boned corset bodice paired with a bias-cut satin maxi. Architectural above, liquid below.',ARRAY['Boned corsetry','Bias-cut satin skirt','Hook-and-eye closure'],true,10),
('alabaster-mini-shoulder-bag','Alabaster Mini Shoulder Bag',38000,'accessories','/__l5e/assets-v1/5a63b9ee-d6ea-414c-b5d1-8cde61c3f8eb/leather-bag.jpg','A compact grained-leather shoulder bag with warm gold hardware. Built for the essentials and nothing else.',ARRAY['Grained leather','Gold-tone hardware','Detachable strap'],false,11);

INSERT INTO public.product_variants (product_id, size, stock)
SELECT p.id, v.size, v.stock FROM public.products p
JOIN (VALUES
 ('leopard-mesh-set','S',4),('leopard-mesh-set','M',2),('leopard-mesh-set','L',0),('leopard-mesh-set','XL',3),('leopard-mesh-set','XXL',0),
 ('tie-dye-floral-midi-dress','S',3),('tie-dye-floral-midi-dress','M',4),('tie-dye-floral-midi-dress','L',2),('tie-dye-floral-midi-dress','XL',0),('tie-dye-floral-midi-dress','XXL',0),
 ('striped-polo-pleated-trouser-set','S',2),('striped-polo-pleated-trouser-set','M',3),('striped-polo-pleated-trouser-set','L',3),('striped-polo-pleated-trouser-set','XL',1),('striped-polo-pleated-trouser-set','XXL',0),
 ('halter-neck-puff-dress','S',0),('halter-neck-puff-dress','M',5),('halter-neck-puff-dress','L',3),('halter-neck-puff-dress','XL',0),('halter-neck-puff-dress','XXL',1),
 ('pleated-polka-dot-dress','S',2),('pleated-polka-dot-dress','M',0),('pleated-polka-dot-dress','L',4),('pleated-polka-dot-dress','XL',2),('pleated-polka-dot-dress','XXL',0),
 ('patchwork-denim-trousers','S',3),('patchwork-denim-trousers','M',3),('patchwork-denim-trousers','L',0),('patchwork-denim-trousers','XL',1),('patchwork-denim-trousers','XXL',2),
 ('miu-miu-curated-cap','S',0),('miu-miu-curated-cap','M',0),('miu-miu-curated-cap','L',0),('miu-miu-curated-cap','XL',0),('miu-miu-curated-cap','XXL',0),
 ('matte-claw-clip-trio','S',6),('matte-claw-clip-trio','M',6),('matte-claw-clip-trio','L',6),('matte-claw-clip-trio','XL',6),('matte-claw-clip-trio','XXL',6),
 ('curated-accessory-gift-box','S',3),('curated-accessory-gift-box','M',0),('curated-accessory-gift-box','L',0),('curated-accessory-gift-box','XL',0),('curated-accessory-gift-box','XXL',0),
 ('sculpted-corset-satin-set','S',1),('sculpted-corset-satin-set','M',2),('sculpted-corset-satin-set','L',2),('sculpted-corset-satin-set','XL',0),('sculpted-corset-satin-set','XXL',0),
 ('alabaster-mini-shoulder-bag','S',2),('alabaster-mini-shoulder-bag','M',0),('alabaster-mini-shoulder-bag','L',0),('alabaster-mini-shoulder-bag','XL',0),('alabaster-mini-shoulder-bag','XXL',0)
) AS v(slug, size, stock) ON v.slug = p.slug;

INSERT INTO public.catalogue_items (title, tag, note, image, position) VALUES
('Leopard Mesh Sets','Apparel','Mesh co-ords, capri sets and second-skin knits. Sizes S–XXL.','/__l5e/assets-v1/ccccd507-cedd-4e02-990a-e421114cfc3a/leopard-real.jpg',1),
('Printed Slip Dresses','Apparel','Ruched midi and maxi slips in watercolour, floral and solid tones.','/__l5e/assets-v1/f5bf09b1-5e67-4f61-bb1d-ef06d4107606/img-2318.jpeg',2),
('Resort Two-Pieces','Apparel','Knit polos, pleated balloon trousers and matching sets.','/__l5e/assets-v1/e730b354-a5fa-498c-af57-64fcf357b8dd/img-2317.jpeg',3),
('Designer-Curated Caps','Headwear','Baker boy caps in black, cream, chocolate and camel.','/__l5e/assets-v1/a509606c-3656-4f06-bc1d-7d1936fff773/img-2319.jpeg',4),
('Matte Claw Clips','Hair','Oversized strong-hold clips — request any colourway.','/__l5e/assets-v1/ea5a1147-1606-4909-99f3-9f9b87b8c5e2/img-2313.jpeg',5),
('Curated Gift Boxes','Gifting','Scrunchies, pearls, studs and clips packed to your colour story.','/__l5e/assets-v1/2cb70f35-a52b-4d07-9417-9ec8ed16e1d5/img-2312.jpeg',6),
('Lash & Beauty Add-Ons','Beauty','Partner price list — classic, hybrid and volume sets.','/__l5e/assets-v1/cf974b63-4526-4c29-95cf-631cec6dd96a/img-2309.jpeg',7),
('China Pre-Order Runs','Sourcing','Bags, shoes, skincare and appliances on scheduled batch runs.','/__l5e/assets-v1/573ac194-275d-4687-98f0-329a854992c5/img-2310.jpeg',8),
('Fit & Size Guide','Reference','Bust, waist and hip in inches — sizes 6 through 24.','/__l5e/assets-v1/f44ea6d3-8072-4839-a3d3-f8609104fcb0/img-2311.jpeg',9);