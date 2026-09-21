-- Sweetbites seed data (matches lib/catalog.ts)

insert into categories (id, name_en, name_es, slug, sort) values
  ('cat-cookies', 'Cookies', 'Galletas', 'cookies', 1),
  ('cat-brownies', 'Brownies', 'Brownies', 'brownies', 2),
  ('cat-cakes', 'Cakes', 'Pasteles', 'cakes', 3),
  ('cat-pastries', 'Pastries', 'Pastelería', 'pastries', 4)
on conflict (id) do nothing;

insert into products (id, category_id, name_en, name_es, slug, description_en, description_es, price_cents, image_url, lead_days, ship_weight_g, ship_l_cm, ship_w_cm, ship_h_cm) values
  ('prod-choc-chip', 'cat-cookies', 'Brown butter chocolate chip', 'Chispas de chocolate con mantequilla dorada', 'brown-butter-chocolate-chip', 'Crisp edges, soft center, Valrhona chips.', 'Bordes crujientes, centro suave, chispas Valrhona.', 350, 'https://images.unsplash.com/photo-1499636136210-6d4ee915583e?w=600&h=600&fit=crop', 0, 120, 15, 15, 5),
  ('prod-oat-raisin', 'cat-cookies', 'Oat raisin cookie', 'Galleta de avena y pasas', 'oat-raisin-cookie', 'Hearty oats, plump raisins, hint of cinnamon.', 'Avena abundante, pasas jugosas, toque de canela.', 320, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=600&fit=crop', 0, 110, 15, 15, 5),
  ('prod-cookie-box', 'cat-cookies', 'Cookie box of 4', 'Caja de 4 galletas', 'cookie-box-of-4', 'Mix and match four bakery favorites.', 'Combina cuatro favoritos de la panadería.', 1400, 'https://images.unsplash.com/photo-1620136878700-94c035d29b04?w=600&h=600&fit=crop', 1, 480, 20, 20, 8),
  ('prod-fudge-brownie', 'cat-brownies', 'Fudge brownie', 'Brownie de fudge', 'fudge-brownie', 'Dense, glossy top, Belgian cocoa.', 'Denso, capa brillante, cacao belga.', 450, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476b?w=600&h=600&fit=crop', 0, 140, 12, 12, 4),
  ('prod-walnut-blondie', 'cat-brownies', 'Walnut blondie', 'Blondie de nuez', 'walnut-blondie', 'Butterscotch notes, toasted walnuts.', 'Notas de butterscotch, nueces tostadas.', 480, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=600&fit=crop', 0, 140, 12, 12, 4),
  ('prod-brownie-box', 'cat-brownies', 'Brownie box of 4', 'Caja de 4 brownies', 'brownie-box-of-4', 'Choose four rich brownie flavors.', 'Elige cuatro sabores intensos de brownie.', 1890, 'https://images.unsplash.com/photo-1564355808539-22fdaed7556a?w=600&h=600&fit=crop', 1, 560, 20, 20, 8),
  ('prod-vanilla-loaf', 'cat-cakes', 'Vanilla bean loaf', 'Bizcocho de vainilla', 'vanilla-bean-loaf', 'Moist crumb, real vanilla specks.', 'Miga húmeda, puntos de vainilla real.', 2200, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=600&fit=crop', 2, 650, 25, 12, 10),
  ('prod-carrot-slice', 'cat-cakes', 'Carrot cake slice', 'Porción de pastel de zanahoria', 'carrot-cake-slice', 'Cream cheese frosting, toasted pecans.', 'Glaseado de queso crema, nueces pecanas.', 850, 'https://images.unsplash.com/photo-1621303837578-0a095332a591?w=600&h=600&fit=crop', 1, 200, 15, 15, 8),
  ('prod-celebration-cake', 'cat-cakes', '6" celebration cake', 'Pastel de celebración 6"', 'celebration-cake-6in', 'Two layers, buttercream, serves 6–8.', 'Dos capas, buttercream, rinde 6–8 porciones.', 4800, 'https://images.unsplash.com/photo-1563729784474-d77dbae933dc?w=600&h=600&fit=crop', 3, 1200, 25, 25, 15),
  ('prod-croissant', 'cat-pastries', 'Butter croissant', 'Croissant de mantequilla', 'butter-croissant', 'Laminated layers, baked fresh each morning.', 'Capas laminadas, horneado cada mañana.', 420, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&h=600&fit=crop', 0, 90, 18, 10, 6),
  ('prod-cinnamon-roll', 'cat-pastries', 'Cinnamon roll', 'Rollo de canela', 'cinnamon-roll', 'Soft spiral, cream cheese glaze.', 'Espiral suave, glaseado de queso crema.', 520, 'https://images.unsplash.com/photo-1607950818062-bb3b6717792d?w=600&h=600&fit=crop', 0, 160, 14, 14, 6),
  ('prod-pastry-box', 'cat-pastries', 'Pastry box of 4', 'Caja de 4 pastelería', 'pastry-box-of-4', 'Assorted viennoiserie for sharing.', 'Viennoiserie surtida para compartir.', 1890, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=600&fit=crop', 1, 520, 22, 22, 10)
on conflict (id) do nothing;

insert into product_options (id, product_id, name_en, name_es, required, max_select) values
  ('opt-flavors-cookie', 'prod-cookie-box', 'Pick your flavors', 'Elige tus sabores', true, 4),
  ('opt-flavors-brownie', 'prod-brownie-box', 'Pick your flavors', 'Elige tus sabores', true, 4),
  ('opt-flavors-pastry', 'prod-pastry-box', 'Pick your flavors', 'Elige tus sabores', true, 4),
  ('opt-cake-flavor', 'prod-celebration-cake', 'Cake flavor', 'Sabor del pastel', true, 1)
on conflict (id) do nothing;

insert into option_values (id, option_id, name_en, name_es) values
  ('fv-choc', 'opt-flavors-cookie', 'Dark chocolate', 'Chocolate oscuro'),
  ('fv-vanilla', 'opt-flavors-cookie', 'Madagascar vanilla', 'Vainilla de Madagascar'),
  ('fv-salted', 'opt-flavors-cookie', 'Salted caramel', 'Caramelo salado'),
  ('fv-raspberry', 'opt-flavors-cookie', 'Raspberry jam', 'Mermelada de frambuesa'),
  ('fv-hazelnut', 'opt-flavors-cookie', 'Toasted hazelnut', 'Avellana tostada'),
  ('fv-lemon', 'opt-flavors-cookie', 'Lemon zest', 'Ralladura de limón'),
  ('fv-choc-b', 'opt-flavors-brownie', 'Dark chocolate', 'Chocolate oscuro'),
  ('fv-vanilla-b', 'opt-flavors-brownie', 'Madagascar vanilla', 'Vainilla de Madagascar'),
  ('fv-salted-b', 'opt-flavors-brownie', 'Salted caramel', 'Caramelo salado'),
  ('fv-raspberry-b', 'opt-flavors-brownie', 'Raspberry jam', 'Mermelada de frambuesa'),
  ('fv-hazelnut-b', 'opt-flavors-brownie', 'Toasted hazelnut', 'Avellana tostada'),
  ('fv-lemon-b', 'opt-flavors-brownie', 'Lemon zest', 'Ralladura de limón'),
  ('fv-choc-p', 'opt-flavors-pastry', 'Dark chocolate', 'Chocolate oscuro'),
  ('fv-vanilla-p', 'opt-flavors-pastry', 'Madagascar vanilla', 'Vainilla de Madagascar'),
  ('fv-salted-p', 'opt-flavors-pastry', 'Salted caramel', 'Caramelo salado'),
  ('fv-raspberry-p', 'opt-flavors-pastry', 'Raspberry jam', 'Mermelada de frambuesa'),
  ('fv-hazelnut-p', 'opt-flavors-pastry', 'Toasted hazelnut', 'Avellana tostada'),
  ('fv-lemon-p', 'opt-flavors-pastry', 'Lemon zest', 'Ralladura de limón'),
  ('fv-choc-cake', 'opt-cake-flavor', 'Chocolate', 'Chocolate'),
  ('fv-vanilla-cake', 'opt-cake-flavor', 'Vanilla', 'Vainilla'),
  ('fv-red-velvet', 'opt-cake-flavor', 'Red velvet', 'Red velvet')
on conflict (id) do nothing;

insert into promo_codes (code, kind, value, min_food_cents) values
  ('SWEET10', 'percent', 10, 0),
  ('BITE5', 'fixed', 500, 2500)
on conflict (code) do nothing;

insert into weekly_offers (id, sort, active, image_url, tag_en, tag_es, title_en, title_es, offer_en, offer_es, cta_href) values
  ('offer-cookie-dozen', 1, true, '/test-images/swb-banner.png', 'This week', 'Esta semana', 'Cookie dozen deal', 'Docena de galletas', 'Buy 11, get 12 — mix any flavors from the menu.', 'Compra 11, lleva 12 — mezcla los sabores del menú.', '/order'),
  ('offer-brownie-bundle', 2, true, '/test-images/img-1128.jpeg', 'This week', 'Esta semana', 'Brownie bundle', 'Pack de brownies', 'Three fudge brownies for $14 — perfect for sharing.', 'Tres brownies de fudge por $14 — ideal para compartir.', '/order'),
  ('offer-cinnamon', 3, true, '/test-images/photoroom-140123.jpg', 'This week', 'Esta semana', 'Weekend cinnamon rolls', 'Rollos de canela del finde', 'Fresh-baked Saturday & Sunday — pre-order by Friday noon.', 'Horneados sábado y domingo — reserva antes del viernes al mediodía.', '/order'),
  ('offer-pickup', 4, true, '/test-images/photoroom-140003.jpg', 'This week', 'Esta semana', 'Free pickup over $30', 'Recogida gratis desde $30', 'Skip the delivery fee when you pick up at our kitchen.', 'Sin cargo de entrega cuando recoges en nuestra cocina.', '/order')
on conflict (id) do nothing;
